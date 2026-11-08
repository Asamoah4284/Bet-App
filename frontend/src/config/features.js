import { Platform } from 'react-native';

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

/**
 * PAYMENTS_ENABLED: Moolre MoMo checkout / paywall.
 * Off on iOS because App Store guideline 3.1.1 requires Apple In-App Purchase for
 * digital subscriptions. On iOS the app is unlocked without a paywall and shows no
 * prices or purchase prompts. Android keeps the Moolre paywall.
 * Replace with StoreKit In-App Purchase on iOS later.
 */
export const PAYMENTS_ENABLED = Platform.OS !== 'ios';
