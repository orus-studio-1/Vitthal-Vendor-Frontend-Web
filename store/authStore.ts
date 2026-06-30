import { create } from "zustand";

export type User = {
  userId: string;
  username?: string;
  email?: string;
  role: string;
  approvalStatus?: "setup_required" | "pending" | "agreement_sent" | "approved" | "rejected" | "reconsideration" | null;
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
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  // start loading true so UI shows skeleton while we check session
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

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
}));
