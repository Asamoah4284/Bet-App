import NetworkExtension
import Foundation

/**
 DNS-only Packet Tunnel for Betapp Shield.
 Routes DNS to a local fake resolver IP handled in-process: blocked names get NXDOMAIN,
 everything else is forwarded to 8.8.8.8. Mirrors the Android VpnService approach.
 */
class PacketTunnelProvider: NEPacketTunnelProvider {
  private let appGroupId = "group.com.betapp.recovery.shield"
  private let domainsKey = "blockedDomains"
  private let fakeDns = "10.55.55.2"
  private let vpnAddress = "10.55.55.1"
  private let upstreamDns = "8.8.8.8"

  private var blockedDomains: Set<String> = []
  private var readLoopActive = false

  override func startTunnel(options: [String: NSObject]?, completionHandler: @escaping (Error?) -> Void) {
    reloadBlocklist()

    let settings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: "10.55.55.1")
    settings.mtu = 1500

    let ipv4 = NEIPv4Settings(addresses: [vpnAddress], subnetMasks: ["255.255.255.255"])
    // Only claim the fake DNS host so normal traffic stays off the tunnel.
    ipv4.includedRoutes = [NEIPv4Route(destinationAddress: fakeDns, subnetMask: "255.255.255.255")]
    settings.ipv4Settings = ipv4

    let dns = NEDNSSettings(servers: [fakeDns])
    dns.matchDomains = [""] // Apply as system DNS while Shield is on.
    settings.dnsSettings = dns

    setTunnelNetworkSettings(settings) { error in
      if let error {
        completionHandler(error)
        return
      }
      self.readLoopActive = true
      self.pumpPackets()
      completionHandler(nil)
    }
  }

  override func stopTunnel(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) {
    readLoopActive = false
    completionHandler()
  }

  private func reloadBlocklist() {
    let defaults = UserDefaults(suiteName: appGroupId)
    let list = defaults?.stringArray(forKey: domainsKey) ?? []
    blockedDomains = Set(list.map { normalize($0) }.filter { !$0.isEmpty })
  }

  private func pumpPackets() {
    packetFlow.readPackets { packets, protocols in
      guard self.readLoopActive else { return }

      var outPackets: [Data] = []
      var outProtocols: [NSNumber] = []

      for (index, packet) in packets.enumerated() {
        let proto = protocols[index]
        if let response = self.handleIpPacket(packet) {
          outPackets.append(response)
          outProtocols.append(proto)
        }
      }

      if !outPackets.isEmpty {
        self.packetFlow.writePackets(outPackets, withProtocols: outProtocols)
      }

      if self.readLoopActive {
        self.pumpPackets()
      }
    }
  }

  private func handleIpPacket(_ packet: Data) -> Data? {
    guard packet.count >= 28 else { return nil }
    let version = packet[0] >> 4
    guard version == 4 else { return nil }

    let ihl = Int(packet[0] & 0x0f) * 4
    guard packet.count >= ihl + 8 else { return nil }
    guard packet[9] == 17 else { return nil } // UDP only

    let udpOffset = ihl
    let dstPort = (Int(packet[udpOffset + 2]) << 8) | Int(packet[udpOffset + 3])
    guard dstPort == 53 else { return nil }

    let dnsOffset = udpOffset + 8
    guard packet.count > dnsOffset else { return nil }
    let dnsPayload = packet.subdata(in: dnsOffset..<packet.count)

    guard let qname = parseQName(dnsPayload) else { return nil }
    let host = normalize(qname)

    let responseDns: Data
    if isBlocked(host) {
      responseDns = buildNxDomain(for: dnsPayload)
    } else if let upstream = forwardUpstream(dnsPayload) {
      responseDns = upstream
    } else {
      return nil
    }

    return buildIpv4UdpResponse(request: packet, ihl: ihl, dnsPayload: responseDns)
  }

  private func isBlocked(_ host: String) -> Bool {
    if blockedDomains.contains(host) { return true }
    for domain in blockedDomains {
      if host.hasSuffix("." + domain) { return true }
    }
    return false
  }

  private func normalize(_ value: String) -> String {
    value
      .lowercased()
      .trimmingCharacters(in: .whitespacesAndNewlines)
      .replacingOccurrences(of: "^https?://", with: "", options: .regularExpression)
      .replacingOccurrences(of: "^www\\.", with: "", options: .regularExpression)
      .trimmingCharacters(in: CharacterSet(charactersIn: "/."))
  }

  private func parseQName(_ dns: Data) -> String? {
    guard dns.count >= 13 else { return nil }
    var index = 12
    var labels: [String] = []

    while index < dns.count {
      let length = Int(dns[index])
      index += 1
      if length == 0 { break }
      if length > 63 || index + length > dns.count { return nil }
      let labelData = dns.subdata(in: index..<(index + length))
      guard let label = String(data: labelData, encoding: .utf8) else { return nil }
      labels.append(label)
      index += length
    }

    return labels.isEmpty ? nil : labels.joined(separator: ".")
  }

  private func buildNxDomain(for query: Data) -> Data {
    var response = Data(query)
    guard response.count >= 12 else { return response }
    // Flags: response + recursion available + name error (RCODE 3)
    response[2] = 0x81
    response[3] = 0x83
    response[6] = 0
    response[7] = 0 // ANCOUNT
    response[8] = 0
    response[9] = 0 // NSCOUNT
    response[10] = 0
    response[11] = 0 // ARCOUNT
    return response
  }

  private func forwardUpstream(_ dnsPayload: Data) -> Data? {
    let socket = Darwin.socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP)
    guard socket >= 0 else { return nil }
    defer { Darwin.close(socket) }

    var timeout = timeval(tv_sec: 2, tv_usec: 0)
    setsockopt(socket, SOL_SOCKET, SO_RCVTIMEO, &timeout, socklen_t(MemoryLayout<timeval>.size))

    var addr = sockaddr_in()
    addr.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
    addr.sin_family = sa_family_t(AF_INET)
    addr.sin_port = in_port_t(UInt16(53).bigEndian)
    inet_pton(AF_INET, upstreamDns, &addr.sin_addr)

    let sent: Int = dnsPayload.withUnsafeBytes { buffer in
      withUnsafePointer(to: &addr) { addrPtr in
        addrPtr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockPtr in
          sendto(socket, buffer.baseAddress, dnsPayload.count, 0, sockPtr, socklen_t(MemoryLayout<sockaddr_in>.size))
        }
      }
    }
    guard sent > 0 else { return nil }

    var response = [UInt8](repeating: 0, count: 4096)
    let received = recv(socket, &response, response.count, 0)
    guard received > 0 else { return nil }
    return Data(response[0..<received])
  }

  private func buildIpv4UdpResponse(request: Data, ihl: Int, dnsPayload: Data) -> Data {
    let udpOffset = ihl
    let totalLength = ihl + 8 + dnsPayload.count
    var packet = Data(count: totalLength)

    // Copy IPv4 header then swap addresses.
    packet.replaceSubrange(0..<ihl, with: request[0..<ihl])
    packet[2] = UInt8((totalLength >> 8) & 0xff)
    packet[3] = UInt8(totalLength & 0xff)
    packet[10] = 0
    packet[11] = 0

    let src = request[12..<16]
    let dst = request[16..<20]
    packet.replaceSubrange(12..<16, with: dst)
    packet.replaceSubrange(16..<20, with: src)

    // UDP
    let srcPort = request[udpOffset..<(udpOffset + 2)]
    let dstPort = request[(udpOffset + 2)..<(udpOffset + 4)]
    packet.replaceSubrange(udpOffset..<(udpOffset + 2), with: dstPort)
    packet.replaceSubrange((udpOffset + 2)..<(udpOffset + 4), with: srcPort)
    let udpLength = 8 + dnsPayload.count
    packet[udpOffset + 4] = UInt8((udpLength >> 8) & 0xff)
    packet[udpOffset + 5] = UInt8(udpLength & 0xff)
    packet[udpOffset + 6] = 0
    packet[udpOffset + 7] = 0
    packet.replaceSubrange((udpOffset + 8)..<totalLength, with: dnsPayload)

    // IPv4 header checksum
    var sum: UInt32 = 0
    for i in stride(from: 0, to: ihl, by: 2) {
      let word = (UInt32(packet[i]) << 8) + UInt32(packet[i + 1])
      sum += word
    }
    while sum >> 16 != 0 {
      sum = (sum & 0xffff) + (sum >> 16)
    }
    let checksum = ~UInt16(sum & 0xffff)
    packet[10] = UInt8((checksum >> 8) & 0xff)
    packet[11] = UInt8(checksum & 0xff)

    return packet
  }
}
