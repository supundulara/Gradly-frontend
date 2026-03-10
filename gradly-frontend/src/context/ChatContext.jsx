import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const ChatContext = createContext(null);

export function resolveDate(ts) {
    if (!ts) return new Date(0);
    if (Array.isArray(ts)) {
        const [y, m, d, h = 0, mn = 0, s = 0] = ts;
        return new Date(y, m - 1, d, h, mn, s);
    }
    const d = new Date(ts);
    return isNaN(d.getTime()) ? new Date(0) : d;
}

export function ChatProvider({ children }) {
    const { userId, isAuthenticated } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [unreadMap, setUnreadMap] = useState({});
    const socketsRef = useRef({});

    // 1. Fetch Conversations on Login
    useEffect(() => {
        if (!isAuthenticated || !userId) {
            setConversations([]);
            setUnreadMap({});
            return;
        }

        const loadConvs = async () => {
            try {
                const res = await api.get('/conversations', { headers: { 'X-User-Id': userId } });
                const data = res.data || [];
                const sorted = data.sort((a, b) => resolveDate(b.updatedAt) - resolveDate(a.updatedAt));
                setConversations(sorted);

                // Initial map check
                const umap = {};
                sorted.forEach(c => {
                    const lastRead = localStorage.getItem(`chat_read_${c.id}`);
                    const updated = resolveDate(c.updatedAt).getTime();
                    // Basic heuristic: if it has been updated since we last read it
                    if (lastRead && updated > parseInt(lastRead, 10)) {
                        umap[c.id] = true;
                    } else if (!lastRead) {
                        // If no read history, only unread if not mostly empty
                        umap[c.id] = false;
                    }
                });
                setUnreadMap(umap);
            } catch (err) {
                console.error("Failed to load initial conversations:", err);
            }
        };

        loadConvs();

        return () => {
            Object.values(socketsRef.current).forEach(ws => ws.close());
            socketsRef.current = {};
        };
    }, [isAuthenticated, userId]);

    // 2. Setup WebSockets for Real-time
    useEffect(() => {
        if (!isAuthenticated || !userId || conversations.length === 0) return;

        conversations.forEach(conv => {
            if (!socketsRef.current[conv.id]) {
                const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
                const ws = new WebSocket(`${wsUrl}/ws/conversations/${conv.id}`);
                socketsRef.current[conv.id] = ws;

                ws.onmessage = (event) => {
                    const newMsg = JSON.parse(event.data);
                    
                    // Dispatch event for active message pane to pick it up locally
                    window.dispatchEvent(new CustomEvent('chat_msg_received', { detail: newMsg }));

                    if (newMsg.senderId !== userId) {
                        setUnreadMap(prev => {
                            // Only mark unread globally if it's currently marked false or undefined
                            // (We also let Messages pane forcefully mark read if they are staring at it)
                            return { ...prev, [conv.id]: true };
                        });
                    }

                    setConversations(prev => {
                        const updated = prev.map(c => {
                            if (c.id === newMsg.conversationId) {
                                return { ...c, lastMessage: newMsg.content, updatedAt: newMsg.createdAt };
                            }
                            return c;
                        });
                        return updated.sort((a, b) => resolveDate(b.updatedAt) - resolveDate(a.updatedAt));
                    });
                };
            }
        });
    }, [conversations, isAuthenticated, userId]);

    const markAsRead = (convId) => {
        localStorage.setItem(`chat_read_${convId}`, Date.now().toString());
        setUnreadMap(prev => ({ ...prev, [convId]: false }));
    };

    const hasAnyUnread = Object.values(unreadMap).some(v => v);

    return (
        <ChatContext.Provider value={{
            conversations,
            unreadMap,
            hasAnyUnread,
            markAsRead,
            setConversations,
            setUnreadMap
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) return { conversations: [], unreadMap: {}, hasAnyUnread: false, markAsRead: () => {} };
    return context;
}
