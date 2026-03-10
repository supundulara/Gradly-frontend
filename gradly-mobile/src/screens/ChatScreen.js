import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import { DeviceEventEmitter } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useChat, resolveDate } from '../context/ChatContext';
import { colors, spacing, radius, typography } from '../theme/colors';
import api from '../api/axios';

function formatTime(ts) {
    if (!ts) return '';
    const d = resolveDate(ts);
    if (!d || isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen({ route, navigation }) {
    const { activeConvId, targetName } = route.params;
    const { userId } = useAuth();
    const { markAsRead, setConversations } = useChat();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    
    // Dynamically calculate padding for notch/navigation bar and header
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();
    
    // Set custom header title
    useEffect(() => {
        navigation.setOptions({ title: targetName || 'Chat' });
        markAsRead(activeConvId);
    }, [activeConvId, targetName]);

    // Fetch messages
    useEffect(() => {
        let isMounted = true;
        const fetchMessages = async () => {
            try {
                const res = await api.get(`/conversations/${activeConvId}/messages`, {
                    headers: { 'X-User-Id': userId }
                });
                if (isMounted) {
                    setMessages(res.data || []);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to load msgs:", err);
                if (isMounted) setLoading(false);
            }
        };
        fetchMessages();

        return () => { isMounted = false; };
    }, [activeConvId, userId]);

    // Listen to global socket
    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('chat_msg_received', (newMsg) => {
            if (newMsg.conversationId === activeConvId) {
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                markAsRead(activeConvId); // immediately read if open
            }
        });
        return () => sub.remove();
    }, [activeConvId]);

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;
        const content = newMessage.trim();
        setNewMessage('');
        setSending(true);

        try {
            const res = await api.post(`/conversations/${activeConvId}/messages`, 
                { content },
                { headers: { 'X-User-Id': userId } }
            );
            
            // Optimistic update
            setMessages(prev => [...prev, res.data]);
            
            // Update conversational history logic
            setConversations(prev => {
                const updated = prev.map(c => {
                    if (c.id === activeConvId) {
                        return { ...c, lastMessage: content, updatedAt: res.data.createdAt };
                    }
                    return c;
                });
                return updated.sort((a, b) => resolveDate(b.updatedAt) - resolveDate(a.updatedAt));
            });
        } catch (err) {
            console.error('Failed to send:', err);
            setNewMessage(content);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item, index }) => {
        const isMine = item.senderId === userId;
        const showAvatar = index === messages.length - 1 || messages[index + 1]?.senderId !== item.senderId;
        
        return (
            <View style={[styles.msgWrapper, isMine ? styles.msgRight : styles.msgLeft]}>
                {!isMine && (
                    <View style={styles.avatarSpace}>
                        {showAvatar && (
                            <View style={styles.miniAvatar}>
                                <Text style={styles.miniAvatarText}>{item.senderName?.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                    </View>
                )}
                <View style={[styles.bubble, isMine ? styles.bubbleRight : styles.bubbleLeft]}>
                    <Text style={[styles.msgText, isMine && styles.msgTextRight]}>{item.content}</Text>
                    <Text style={[styles.timeText, isMine && styles.timeTextRight]}>{formatTime(item.createdAt)}</Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : headerHeight + 20}
        >
            {loading ? (
                <ActivityIndicator style={{ flex: 1 }} color={colors.primary} size="large" />
            ) : (
                <FlatList
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.listContent}
                    initialNumToRender={20}
                    maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                />
            )}
            <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.textMuted}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={1000}
                />
                <TouchableOpacity 
                    style={[styles.sendBtn, (!newMessage.trim() || sending) && { opacity: 0.5 }]} 
                    onPress={handleSend}
                    disabled={!newMessage.trim() || sending}
                >
                    <Ionicons name="send" size={20} color={colors.background} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
    msgWrapper: {
        flexDirection: 'row',
        marginBottom: spacing.xs,
        alignItems: 'flex-end',
    },
    msgLeft: { justifyContent: 'flex-start' },
    msgRight: { justifyContent: 'flex-end' },
    avatarSpace: { width: 30, marginRight: 8 },
    miniAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.surfaceHover,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    miniAvatarText: { color: colors.textSecondary, fontSize: 10, fontWeight: 'bold' },
    bubble: {
        maxWidth: '75%',
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        borderRadius: 20,
    },
    bubbleLeft: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderBottomLeftRadius: 4,
    },
    bubbleRight: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    msgText: { fontSize: 14, color: colors.text, lineHeight: 20 },
    msgTextRight: { color: colors.background },
    timeText: { fontSize: 10, color: colors.textMuted, marginTop: 4, alignSelf: 'flex-start' },
    timeTextRight: { color: 'rgba(0,0,0,0.5)', alignSelf: 'flex-end' },
    inputArea: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        paddingHorizontal: spacing.md,
        paddingTop: 12,
        paddingBottom: 12,
        maxHeight: 120,
        color: colors.text,
        fontSize: 15,
        marginRight: spacing.sm,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
});
