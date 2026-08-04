import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shieldApi } from '../services/api';
import {
  addCustomBlockDomain,
  listCustomBlockDomains,
  removeCustomBlockDomain,
} from '../services/localDb';
import {
  getShieldCapability,
  getShieldVpnStatus,
  prepareShieldVpnPermission,
  startShieldVpn,
  stopShieldVpn,
} from '../services/shieldVpn';
import { useAuthStore } from './authStore';

const ENABLED_KEY = 'betapp.shield.enabled';

function token() {
  return useAuthStore.getState().token;
}

function mergeDomains(serverDomains, customRows) {
  const custom = customRows.map((row) => row.domain);
  return [...new Set([...(serverDomains || []), ...custom])];
}

export const useShieldStore = create((set, get) => ({
  targets: [],
  serverDomains: [],
  androidPackages: [],
  customDomains: [],
  enabled: false,
  vpnActive: false,
  capability: getShieldCapability(),
  loading: false,
  error: null,

  hydrate: async () => {
    set({ loading: true, error: null });
    try {
      const [enabledRaw, customDomains, capability, vpn] = await Promise.all([
        AsyncStorage.getItem(ENABLED_KEY),
        listCustomBlockDomains(),
        Promise.resolve(getShieldCapability()),
        getShieldVpnStatus(),
      ]);

      const enabled = enabledRaw === '1';
      set({
        customDomains,
        enabled,
        capability,
        vpnActive: Boolean(vpn.active),
        loading: false,
      });

      if (token()) {
        await get().syncTargets();
      }

      if (enabled && capability.available && !vpn.active) {
        const domains = mergeDomains(get().serverDomains, get().customDomains);
        if (domains.length) {
          await startShieldVpn(domains).catch(() => {});
          const next = await getShieldVpnStatus();
          set({ vpnActive: Boolean(next.active) });
        }
      }
    } catch (error) {
      set({ loading: false, error: error.message });
    }
  },

  syncTargets: async () => {
    if (!token()) return;
    try {
      const result = await shieldApi.targets(token());
      set({
        targets: result.targets || [],
        serverDomains: result.domains || [],
        androidPackages: result.androidPackages || [],
        error: null,
      });
    } catch (error) {
      set({ error: error.message });
    }
  },

  refreshStatus: async () => {
    const capability = getShieldCapability();
    const vpn = await getShieldVpnStatus();
    set({ capability, vpnActive: Boolean(vpn.active) });
  },

  setEnabled: async (enabled) => {
    set({ error: null, loading: true });
    try {
      const capability = getShieldCapability();
      if (enabled && !capability.available) {
        set({ loading: false, capability, error: capability.message });
        throw new Error(capability.message);
      }

      if (enabled) {
        const permission = await prepareShieldVpnPermission();
        if (!permission.granted) {
          set({ loading: false, capability });
          throw new Error('VPN permission is required to block betting websites.');
        }

        await get().syncTargets();
        const customDomains = await listCustomBlockDomains();
        const domains = mergeDomains(get().serverDomains, customDomains);
        await startShieldVpn(domains);
        await AsyncStorage.setItem(ENABLED_KEY, '1');
        const vpn = await getShieldVpnStatus();
        set({
          enabled: true,
          customDomains,
          vpnActive: Boolean(vpn.active),
          capability,
          loading: false,
        });
        return;
      }

      await stopShieldVpn();
      await AsyncStorage.setItem(ENABLED_KEY, '0');
      set({ enabled: false, vpnActive: false, capability, loading: false });
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  addCustomDomain: async (domain) => {
    await addCustomBlockDomain(domain);
    const customDomains = await listCustomBlockDomains();
    set({ customDomains });

    if (get().enabled && get().capability.available) {
      const domains = mergeDomains(get().serverDomains, customDomains);
      await startShieldVpn(domains);
      const vpn = await getShieldVpnStatus();
      set({ vpnActive: Boolean(vpn.active) });
    }
  },

  removeCustomDomain: async (domain) => {
    await removeCustomBlockDomain(domain);
    const customDomains = await listCustomBlockDomains();
    set({ customDomains });

    if (get().enabled && get().capability.available) {
      const domains = mergeDomains(get().serverDomains, customDomains);
      if (domains.length) {
        await startShieldVpn(domains);
      } else {
        await stopShieldVpn();
        await AsyncStorage.setItem(ENABLED_KEY, '0');
        set({ enabled: false, vpnActive: false });
      }
    }
  },
}));
