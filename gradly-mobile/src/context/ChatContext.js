import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
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

    // Fetch initial conversations
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

                const umap = {};
                for (const c of sorted) {
                    const lastRead = await AsyncStorage.getItem(`chat_read_${c.id}`);
                    const updated = resolveDate(c.updatedAt).getTime();
                    if (lastRead && updated > parseInt(lastRead, 10)) {
                        umap[c.id] = true;
                    } else if (!lastRead) {
                        umap[c.id] = false; // Could be false or true depending on preference 
                    }
                }
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

    // Setup WebSockets for each conversation
    useEffect(() => {
        if (!isAuthenticated || !userId || conversations.length === 0) return;

        conversations.forEach(conv => {
            if (!socketsRef.current[conv.id]) {
                const ws = new WebSocket(`ws://192.168.155.89:8080/ws/conversations/${conv.id}`);
                socketsRef.current[conv.id] = ws;

                ws.onmessage = (event) => {
                    const newMsg = JSON.parse(event.data);
                    
                    // Dispatch to listening ChatScreens
                    DeviceEventEmitter.emit('chat_msg_received', newMsg);

                    if (newMsg.senderId !== userId) {
                        setUnreadMap(prev => ({ ...prev, [conv.id]: true }));
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

                ws.onerror = (e) => console.error("WS error:", e);
                ws.onclose = () => delete socketsRef.current[conv.id];
            }
        });
    }, [conversations, isAuthenticated, userId]);

    const markAsRead = async (convId) => {
        await AsyncStorage.setItem(`chat_read_${convId}`, Date.now().toString());
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
    if (!context) return { conversations: [], unreadMap: {}, hasAnyUnread: false, markAsRead: async () => {} };
    return context;
}
