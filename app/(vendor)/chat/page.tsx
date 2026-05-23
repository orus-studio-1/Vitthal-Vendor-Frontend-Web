"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { vendorChatApi, VendorChatMessage, VendorChatResponse } from "@/lib/api";
import { toast } from "sonner";
import { Send, User, ShieldAlert, Loader2 } from "lucide-react";

const ADMIN_API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || process.env.NEXT_PUBLIC_QUOTATION_API_URL || "http://localhost:9001";

export default function VendorChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<VendorChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [vendorDetails, setVendorDetails] = useState<VendorChatResponse["vendor"] | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    fetchMessages();

    // Setup native WebSocket
    const wsUrl = ADMIN_API_BASE_URL.replace("http://", "ws://").replace("https://", "wss://");
    const token = typeof window !== 'undefined' ? localStorage.getItem('vendor_token') : null;
    const ws = new WebSocket(`${wsUrl}?token=${token || ''}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === "new_message" || msg.event === "message_echo") {
          const payload = msg.data;
          setMessages((prev) => {
            // Prevent duplicate messages
            if (prev.some(m => m.id === payload.message.id)) return prev;
            return [...prev, payload.message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          });
        }
      } catch (err) {
        console.error("Error parsing websocket message", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (wsConnected && vendorDetails?.id && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ event: "join_chat", data: { vendorId: vendorDetails.id } }));
    }
  }, [wsConnected, vendorDetails]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const res = await vendorChatApi.getMessages(1, 100); // Fetch latest 100 messages
      if (res.data) {
        setMessages(res.data.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        setVendorDetails(res.data.vendor);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load chat history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setIsSending(true);
      const res = await vendorChatApi.sendMessage(newMessage.trim());
      if (res.data) {
        setNewMessage("");
        // We can optimistically add or wait for socket event
        setMessages((prev) => {
          if (prev.some(m => m.id === res.data!.id)) return prev;
          return [...prev, res.data!];
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Support Chat</h1>
          <p className="text-sm text-zinc-500">Chat directly with the MTWO admin team.</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-xl shadow-sm border border-zinc-200">
        {/* Chat Messages */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-zinc-50/50">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-zinc-500">
                <ShieldAlert className="mx-auto h-12 w-12 text-zinc-300 mb-3" />
                <p>No messages yet.</p>
                <p className="text-sm">Send a message to start the conversation.</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isAdmin = msg.senderRole === "admin" || msg.senderRole === "super_admin";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}
                >
                  <div className={`flex max-w-[80%] sm:max-w-[70%] gap-3 ${isAdmin ? "flex-row" : "flex-row-reverse"}`}>
                    <div className="flex-shrink-0">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isAdmin ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
                        {isAdmin ? <ShieldAlert size={16} /> : <User size={16} />}
                      </div>
                    </div>
                    <div>
                      <div className={`flex items-baseline gap-2 mb-1 ${isAdmin ? "justify-start" : "justify-end"}`}>
                        <span className="text-xs font-medium text-zinc-700">
                          {isAdmin ? "Admin Team" : "You"}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${isAdmin
                            ? "bg-white border border-zinc-200 text-zinc-800 rounded-tl-none shadow-sm"
                            : "bg-emerald-600 text-white rounded-tr-none shadow-sm"
                          }`}
                      >
                        {msg.body}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-zinc-200 p-4 bg-white">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
