import { NativeModulesProxy, requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

let BetappShield = null;

try {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    BetappShield = requireNativeModule('BetappShield');
  }
} catch {
  BetappShield = NativeModulesProxy.BetappShield || null;
}

export function isSupported() {
  return (Platform.OS === 'android' || Platform.OS === 'ios') && !!BetappShield;
}

export async function prepare() {
  if (!BetappShield) return { granted: false };
  return BetappShield.prepare();
}

export async function start(domains) {
  if (!BetappShield) {
    throw new Error('Shield native module is unavailable');
  }
  return BetappShield.start(domains);
}

export async function stop() {
  if (!BetappShield) return { active: false };
  return BetappShield.stop();
}

export async function getStatus() {
  if (!BetappShield) return { active: false };
  return BetappShield.getStatus();
}

export default {
  isSupported,
  prepare,
  start,
  stop,
  getStatus,
};
