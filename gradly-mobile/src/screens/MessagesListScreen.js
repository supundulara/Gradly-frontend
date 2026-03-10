import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useChat, resolveDate } from '../context/ChatContext';
import { colors, spacing, radius, typography } from '../theme/colors';
import api from '../api/axios';

function formatTime(ts) {
    if (!ts) return '';
    const d = resolveDate(ts);
    if (!d || isNaN(d.getTime())) return '';
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function MessagesListScreen({ navigation }) {
    const { userId } = useAuth();
    const { conversations, unreadMap } = useChat();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.trim().length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        const debounceTimer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await api.get(`/users/search?query=${encodeURIComponent(searchQuery.trim())}`, {
                    headers: { 'X-User-Id': userId }
                });
                setSearchResults((res.data || []).filter(u => u.id !== userId));
            } catch (err) {
                console.error('Failed to search users:', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, userId]);

    const handleStartConversation = async (targetUserId, targetName) => {
        try {
            setSearchQuery('');
            setSearchResults([]);
            
            const res = await api.post('/conversations', { receiverId: targetUserId }, { headers: { 'X-User-Id': userId } });
            navigation.navigate('Chat', { activeConvId: res.data.id, targetName });
        } catch (err) {
            console.error('Failed to start conversation:', err);
        }
    };

    const getOtherName = (conv) => {
        if (!conv || !conv.participantIds) return 'Unknown';
        const idx = conv.participantIds.findIndex(id => id !== userId);
        return idx !== -1 ? conv.participantNames[idx] : 'Unknown';
    };

    const renderSearchItem = ({ item }) => (
        <TouchableOpacity style={styles.convItem} onPress={() => handleStartConversation(item.id, item.name)}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.convInfo}>
                <Text style={styles.convName}>{item.name}</Text>
                <Text style={styles.convLastMessage}>Start a conversation</Text>
            </View>
        </TouchableOpacity>
    );

    const renderConvItem = ({ item }) => {
        const otherName = getOtherName(item);
        const isUnread = unreadMap[item.id];
        
        return (
            <TouchableOpacity style={styles.convItem} onPress={() => navigation.navigate('Chat', { activeConvId: item.id, targetName: otherName })}>
                <View>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{otherName.charAt(0).toUpperCase()}</Text>
                    </View>
                    {isUnread && <View style={styles.unreadDot} />}
                </View>
                <View style={styles.convInfo}>
                    <View style={styles.convHeader}>
                        <Text style={[styles.convName, isUnread && styles.unreadText]}>{otherName}</Text>
                        <Text style={[styles.timeText, isUnread && styles.unreadTimeText]}>{formatTime(item.updatedAt)}</Text>
                    </View>
                    <Text style={[styles.convLastMessage, isUnread && styles.unreadText]} numberOfLines={1}>
                        {item.lastMessage || 'Started a conversation'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users to message..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {searchQuery.trim().length > 0 ? (
                // Search Results
                isSearching ? (
                    <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} />
                ) : searchResults.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search-outline" size={40} color={colors.textMuted} style={{opacity: 0.5}} />
                        <Text style={styles.emptyText}>No users found</Text>
                    </View>
                ) : (
                    <FlatList
                        data={searchResults}
                        keyExtractor={item => item.id}
                        renderItem={renderSearchItem}
                    />
                )
            ) : (
                // Normal Conversations List
                conversations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} style={{opacity: 0.5}} />
                        <Text style={styles.emptyText}>No conversations yet</Text>
                        <Text style={styles.emptySubText}>Use the search bar above to start messaging.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={conversations}
                        keyExtractor={item => item.id}
                        renderItem={renderConvItem}
                        contentContainerStyle={{ paddingBottom: spacing.xxl }}
                    />
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    searchIcon: { marginRight: spacing.sm },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontSize: 14,
        paddingVertical: spacing.sm,
    },
    clearBtn: { padding: spacing.xs },
    convItem: {
        flexDirection: 'row',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarText: { color: colors.primary, fontSize: 18, fontWeight: 'bold' },
    unreadDot: {
        position: 'absolute',
        top: 0,
        right: spacing.md,
        width: 12,
        height: 12,
        backgroundColor: colors.primary,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.background,
    },
    convInfo: { flex: 1 },
    convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    convName: { ...typography.h3, fontSize: 15, color: colors.textSecondary },
    unreadText: { color: colors.text, fontWeight: '700' },
    timeText: { fontSize: 11, color: colors.textMuted },
    unreadTimeText: { color: colors.primary, fontWeight: 'bold' },
    convLastMessage: { ...typography.body, fontSize: 13, color: colors.textMuted },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
    emptyText: { ...typography.h3, marginTop: spacing.md, color: colors.text },
    emptySubText: { ...typography.small, textAlign: 'center', marginTop: spacing.sm },
});
