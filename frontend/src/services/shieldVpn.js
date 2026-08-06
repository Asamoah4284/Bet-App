import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Bridge to the local `betapp-shield` Expo module
 * (Android DNS VPN + iOS Packet Tunnel DNS filter).
 * Unavailable in Expo Go.
 */

function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

function loadNativeModule() {
  if (isExpoGo() || (Platform.OS !== 'android' && Platform.OS !== 'ios')) {
    return null;
  }

  try {
    // Lazy require so Expo Go never crashes on missing native code.
    // eslint-disable-next-line global-require, import/no-unresolved
    return require('betapp-shield');
  } catch {
    return null;
  }
}

export function getShieldCapability() {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return {
      available: false,
      reason: 'unsupported',
      message: 'Shield website blocking is available on Android and iOS development builds.',
    };
  }

  if (isExpoGo()) {
    return {
      available: false,
      reason: 'expo-go',
      message:
        Platform.OS === 'ios'
          ? 'Shield needs a development build (not Expo Go). Run an EAS iOS build that includes the Network Extension.'
          : 'Shield needs a development build (not Expo Go). Run prebuild and install the Android app to enable DNS blocking.',
    };
  }

  const native = loadNativeModule();
  if (!native?.isSupported?.()) {
    return {
      available: false,
      reason: 'missing-native',
      message:
        Platform.OS === 'ios'
          ? 'Shield native tunnel is not linked. Rebuild with EAS (iOS Network Extension) or `npx expo prebuild` + `npx expo run:ios`.'
          : 'Shield native module is not linked. Rebuild with `npx expo prebuild` then `npx expo run:android`.',
    };
  }

  return { available: true, reason: null, message: null };
}

export async function getShieldVpnStatus() {
  const capability = getShieldCapability();
  if (!capability.available) {
    return { active: false, ...capability };
  }

  const native = loadNativeModule();
  const status = await native.getStatus();
  return { ...capability, active: Boolean(status?.active) };
}

export async function startShieldVpn(domains) {
  const capability = getShieldCapability();
  if (!capability.available) {
    throw new Error(capability.message);
  }

  const unique = [...new Set((domains || []).map((d) => String(d).toLowerCase().trim()).filter(Boolean))];
  if (!unique.length) {
    throw new Error('Add at least one domain before enabling Shield.');
  }

  const native = loadNativeModule();
  await native.start(unique);
  return getShieldVpnStatus();
}

export async function stopShieldVpn() {
  const capability = getShieldCapability();
  if (!capability.available) {
    return { active: false, ...capability };
  }

  const native = loadNativeModule();
  await native.stop();
  return getShieldVpnStatus();
}

export async function prepareShieldVpnPermission() {
  const capability = getShieldCapability();
  if (!capability.available) {
    return { granted: false, ...capability };
  }

  const native = loadNativeModule();
  if (typeof native.prepare !== 'function') {
    return { granted: true, ...capability };
  }

  const result = await native.prepare();
  return { granted: Boolean(result?.granted), ...capability };
}
