Pod::Spec.new do |s|
  s.name           = 'BetappShield'
  s.version        = '1.0.0'
  s.summary        = 'Betapp Shield local DNS filter (iOS Packet Tunnel host)'
  s.description    = 'Host module that manages the Network Extension Packet Tunnel used by Shield'
  s.license        = 'MIT'
  s.author         = 'Betapp'
  s.homepage       = 'https://github.com/Asamoah4284/Bet-App'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = 'BetappShieldModule.swift', 'BetappShieldController.swift'
end
