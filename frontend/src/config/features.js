/**
 * Feature flags.
 *
 * SHIELD_ENABLED: on-device website blocking (Android VpnService / iOS Packet Tunnel).
 * Disabled for now because App Store review rejected the VPN / Network Extension usage.
 * To re-enable: set this to true, restore the Network Extension + App Group entitlements
 * and the "./modules/betapp-shield/app.plugin.js" plugin in app.json, and remove
 * "betapp-shield" from expo.autolinking.exclude in package.json.
 */
export const SHIELD_ENABLED = false;
