import Foundation
import NetworkExtension

enum BetappShieldConstants {
  static let appGroupId = "group.com.betapp.recovery.shield"
  static let domainsKey = "blockedDomains"
  static let tunnelBundleId = "com.betapp.recovery.ShieldTunnel"
  static let localizedDescription = "Betapp Shield"
}

final class BetappShieldController {
  static let shared = BetappShieldController()

  private init() {}

  private var preferencesSuite: UserDefaults? {
    UserDefaults(suiteName: BetappShieldConstants.appGroupId)
  }

  func saveDomains(_ domains: [String]) {
    let normalized = Array(
      Set(
        domains
          .map { $0.lowercased().trimmingCharacters(in: .whitespacesAndNewlines) }
          .filter { !$0.isEmpty }
      )
    )
    preferencesSuite?.set(normalized, forKey: BetappShieldConstants.domainsKey)
    preferencesSuite?.synchronize()
  }

  func loadManager(completion: @escaping (NETunnelProviderManager?, Error?) -> Void) {
    NETunnelProviderManager.loadAllFromPreferences { managers, error in
      if let error {
        completion(nil, error)
        return
      }

      let existing = managers?.first(where: {
        ($0.protocolConfiguration as? NETunnelProviderProtocol)?.providerBundleIdentifier
          == BetappShieldConstants.tunnelBundleId
      })

      if let existing {
        completion(existing, nil)
        return
      }

      let manager = NETunnelProviderManager()
      let proto = NETunnelProviderProtocol()
      proto.providerBundleIdentifier = BetappShieldConstants.tunnelBundleId
      proto.serverAddress = "Betapp Shield"
      manager.protocolConfiguration = proto
      manager.localizedDescription = BetappShieldConstants.localizedDescription
      manager.isEnabled = true
      completion(manager, nil)
    }
  }

  func prepare(completion: @escaping (Bool, Error?) -> Void) {
    loadManager { manager, error in
      if let error {
        completion(false, error)
        return
      }
      guard let manager else {
        completion(false, nil)
        return
      }

      manager.isEnabled = true
      manager.saveToPreferences { saveError in
        if let saveError {
          // User cancelled the VPN permission sheet.
          let nsError = saveError as NSError
          if nsError.domain == NEVPNErrorDomain, nsError.code == NEVPNError.configurationReadWriteFailed.rawValue {
            completion(false, nil)
            return
          }
          completion(false, saveError)
          return
        }

        manager.loadFromPreferences { loadError in
          if let loadError {
            completion(false, loadError)
            return
          }
          completion(true, nil)
        }
      }
    }
  }

  func start(domains: [String], completion: @escaping (Bool, Error?) -> Void) {
    saveDomains(domains)
    loadManager { manager, error in
      if let error {
        completion(false, error)
        return
      }
      guard let manager else {
        completion(false, nil)
        return
      }

      manager.isEnabled = true
      manager.saveToPreferences { saveError in
        if let saveError {
          completion(false, saveError)
          return
        }

        manager.loadFromPreferences { loadError in
          if let loadError {
            completion(false, loadError)
            return
          }

          do {
            if manager.connection.status == .connected || manager.connection.status == .connecting {
              completion(true, nil)
              return
            }
            try manager.connection.startVPNTunnel()
            completion(true, nil)
          } catch {
            completion(false, error)
          }
        }
      }
    }
  }

  func stop(completion: @escaping (Bool, Error?) -> Void) {
    loadManager { manager, error in
      if let error {
        completion(false, error)
        return
      }
      manager?.connection.stopVPNTunnel()
      completion(true, nil)
    }
  }

  func status(completion: @escaping (Bool) -> Void) {
    loadManager { manager, _ in
      let active = manager?.connection.status == .connected
        || manager?.connection.status == .connecting
        || manager?.connection.status == .reasserting
      completion(active)
    }
  }
}
