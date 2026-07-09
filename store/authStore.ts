import { create } from "zustand";

export type User = {
  userId: string;
  username?: string;
  email?: string;
  role: string;
  approvalStatus?: "setup_required" | "pending" | "agreement_sent" | "approved" | "rejected" | "reconsideration" | null;
  vendorType?: "product" | "service" | "both" | null;
  deletionRequestedAt?: string | null;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setVendorSession: (session: {
    id: string;
    role: string;
    approvalStatus: "setup_required" | "pending" | "agreement_sent" | "approved" | "rejected" | "reconsideration" | null;
  }) => void;
  clearUser: () => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  recoverAccount: () => Promise<void>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({
    user: {
      ...user,
      deletionRequestedAt: (user as any).deletion_requested_at || user.deletionRequestedAt || null
    },
    isAuthenticated: true,
    isLoading: false
  }),

  setVendorSession: (session) =>
    set((state) => ({
      user: {
        userId: session.id,
        role: session.role,
        approvalStatus: session.approvalStatus,
        username: state.user?.username,
        email: state.user?.email,
      },
      isAuthenticated: Boolean(session.id),
      isLoading: false,
    })),

  clearUser: () => {
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
      });

      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          user: {
            ...data.user,
            deletionRequestedAt: data.user.deletion_requested_at || data.user.deletionRequestedAt || null,
            approvalStatus: state.user?.approvalStatus ?? null,
          },
          isAuthenticated: true,
          isLoading: false,
        }));
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
      });
    } catch {
      // ignore
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  deleteAccount: async () => {
    try {
      await fetch(`${API_URL}/api/auth/delete-account`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
      });
    } catch {
      // ignore
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  recoverAccount: async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/recover-account`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
      });
      if (res.ok) {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              deletionRequestedAt: null
            }
          });
        }
      }
    } catch {
      // ignore
    }
  },
}));
