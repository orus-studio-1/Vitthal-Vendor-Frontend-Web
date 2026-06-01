import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
const PAGE_SIZE = 20;

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
};

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  socket: Socket | null;
  _pollTimer: ReturnType<typeof setInterval> | null;
  fetchNotifications: () => Promise<void>;
  fetchMore: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  initSocket: (userId: string) => void;
  disconnectSocket: () => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  isLoading: false,
  isLoadingMore: false,
  hasMore: false,
  nextCursor: null,
  socket: null,
  _pollTimer: null,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/api/notifications?limit=${PAGE_SIZE}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-request-from": "vendor" },
      });
      if (res.ok) {
        const data = await res.json();
        set({
          notifications: data.data?.notifications || [],
          unreadCount: data.data?.unread || 0,
          total: data.data?.total || 0,
          hasMore: data.data?.hasMore || false,
          nextCursor: data.data?.nextCursor || null,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  fetchMore: async () => {
    const { nextCursor, hasMore, isLoadingMore } = get();
    if (!hasMore || isLoadingMore || !nextCursor) return;

    set({ isLoadingMore: true });
    try {
      const res = await fetch(
        `${API_BASE}/api/notifications?limit=${PAGE_SIZE}&cursor=${encodeURIComponent(nextCursor)}`,
        {
          credentials: "include",
          headers: { "Content-Type": "application/json", "x-request-from": "vendor" },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const newNotifs: Notification[] = data.data?.notifications || [];

        set((state) => {
          // Deduplicate
          const existingIds = new Set(state.notifications.map((n) => n.id));
          const unique = newNotifs.filter((n) => !existingIds.has(n.id));

          return {
            notifications: [...state.notifications, ...unique],
            hasMore: data.data?.hasMore || false,
            nextCursor: data.data?.nextCursor || null,
            isLoadingMore: false,
          };
        });
      } else {
        set({ isLoadingMore: false });
      }
    } catch {
      set({ isLoadingMore: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-request-from": "vendor" },
      });
      if (res.ok) {
        const data = await res.json();
        set({ unreadCount: data.data?.unread || 0 });
      }
    } catch {
      // ignore
    }
  },

  markRead: async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-request-from": "vendor" },
      });
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // ignore
    }
  },

  markAllRead: async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-request-from": "vendor" },
      });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch {
      // ignore
    }
  },

  initSocket: (userId: string) => {
    const state = get();
    if (state.socket) return;

    const socket = io(`${API_BASE}/notifications`, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.emit("join", userId);

    socket.on("notification", (notif: Notification) => {

      set((prev) => {
        if (prev.notifications.some((n) => n.id === notif.id)) return {};

        return {
          notifications: [notif, ...prev.notifications],
          unreadCount: prev.unreadCount + 1,
          total: prev.total + 1,
        };
      });

      toast.info(notif.title, {
        description: notif.body,
      });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
