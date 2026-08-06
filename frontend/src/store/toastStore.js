import { create } from 'zustand';

let nextId = 1;

export const useToastStore = create((set, get) => ({
  toasts: [],

  show: ({ title, body, icon = 'trophy-outline', tint = 'secondary', onPress } = {}) => {
    const id = nextId;
    nextId += 1;
    set({
      toasts: [...get().toasts, { id, title, body, icon, tint, onPress }],
    });
    return id;
  },

  dismiss: (id) => {
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) });
  },

  clear: () => set({ toasts: [] }),
}));
