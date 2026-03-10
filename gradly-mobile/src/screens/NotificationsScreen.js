import { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing, typography } from '../theme/colors';
import api from '../api/axios';

function timeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function notifStyle(n) {
    const m = (n.message || '').toLowerCase();
    if (m.includes('liked') || m.includes('like')) return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' };
    if (m.includes('comment')) return { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa' };
    if (m.includes('attending') || m.includes('rsvp')) return { bg: 'rgba(34,197,94,0.1)', color: colors.primary };
    if (m.includes('cancel')) return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' };
    return { bg: 'rgba(168,85,247,0.1)', color: '#c084fc' };
}

function buildMessage(n) {
    const actor = n.actorName || n.creatorName || 'Someone';
    const msg = n.message || '';
    const title = n.eventTitle;
    return title ? `${actor} ${msg}: ${title}` : `${actor} ${msg}`;
}

function NotifItem({ n }) {
    const ns = notifStyle(n);
    const actor = n.actorName || n.creatorName || '?';
    return (
        <View style={[styles.item, !n.read && styles.itemUnread]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                <View style={{ alignItems: 'center', gap: spacing.xs }}>
                    {!n.read && <View style={styles.unreadDot} />}
                    <View style={[styles.actorAvatar, { backgroundColor: ns.bg }]}>
                        <Text style={[styles.actorInitial, { color: ns.color }]}>{actor.charAt(0).toUpperCase()}</Text>
                    </View>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.message}>{buildMessage(n)}</Text>
                    <Text style={styles.time}>{timeAgo(n.createdAt)}</Text>
                </View>
                {!n.read && (
                    <View style={styles.newBadge}><Text style={styles.newBadgeText}>New</Text></View>
                )}
            </View>
        </View>
    );
}

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetch = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        setError('');
        try {
            const res = await api.get('notifications');
            const data = Array.isArray(res.data) ? res.data : [];
            setNotifications([...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            const d = err.response?.data;
            setError((typeof d === 'string' ? d : d?.message || d?.error) || 'Failed to load notifications.');
        } finally { setLoading(false); setRefreshing(false); }
    }, []);

    useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id || String(Math.random())}
                renderItem={({ item }) => <NotifItem n={item} />}
                ListHeaderComponent={
                    error ? (
                        <View style={styles.errorBox}>
                            <Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text>
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    loading
                        ? <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
                        : <View style={{ alignItems: 'center', marginTop: 80 }}>
                            <Ionicons name="checkmark-done-circle-outline" size={40} color={colors.textMuted} />
                            <Text style={[typography.body, { marginTop: spacing.md }]}>All caught up!</Text>
                            <Text style={[typography.small, { marginTop: spacing.xs }]}>No notifications yet.</Text>
                        </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetch(true)} tintColor={colors.primary} />
                }
                contentContainerStyle={{ paddingVertical: spacing.xs }}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    item: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    itemUnread: { backgroundColor: 'rgba(34,197,94,0.03)' },
    unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
    actorAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    actorInitial: { fontWeight: '800', fontSize: 15 },
    message: { color: colors.text, fontSize: 13, lineHeight: 19, marginBottom: spacing.xs },
    time: { color: colors.textMuted, fontSize: 11 },
    newBadge: { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
    newBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
    separator: { height: 1, backgroundColor: colors.borderSubtle, marginHorizontal: spacing.lg },
    errorBox: { margin: spacing.lg, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
});
