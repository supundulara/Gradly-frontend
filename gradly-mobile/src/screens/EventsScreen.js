import { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography } from '../theme/colors';
import api from '../api/axios';

function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function isUpcoming(ts) { return ts && new Date(ts) > new Date(); }

function EventCard({ event, isRsvped, navigation }) {
    const upcoming = isUpcoming(event.eventDate);
    const day = new Date(event.eventDate).getDate();
    const month = new Date(event.eventDate).toLocaleString('en-US', { month: 'short' });

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
            activeOpacity={0.85}
        >
            <View style={styles.cardHeader}>
                {/* Date box */}
                <View style={styles.dateBox}>
                    <Text style={styles.dateDay}>{day}</Text>
                    <Text style={styles.dateMonth}>{month.toUpperCase()}</Text>
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
                    {event.creatorName && <Text style={styles.creator}>by {event.creatorName}</Text>}
                </View>

                <View style={styles.badges}>
                    {upcoming
                        ? <View style={styles.badgeGreen}><Text style={styles.badgeGreenText}>Upcoming</Text></View>
                        : <View style={styles.badgeGray}><Text style={styles.badgeGrayText}>Past</Text></View>}
                    {isRsvped && (
                        <View style={styles.goingRow}>
                            <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                            <Text style={styles.goingText}>Going</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.metaRow}>
                {event.location && (
                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                        <Text style={styles.metaText}>{event.location}</Text>
                    </View>
                )}
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.metaText}>{formatDate(event.eventDate)}</Text>
                </View>
            </View>

            {event.description ? (
                <Text style={styles.description} numberOfLines={2}>{event.description}</Text>
            ) : null}
        </TouchableOpacity>
    );
}

export default function EventsScreen({ navigation }) {
    const { userId } = useAuth();
    const [events, setEvents] = useState([]);
    const [rsvpedIds, setRsvpedIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const res = await api.get('events');
            const data = Array.isArray(res.data) ? res.data
                : res.data?.content || res.data?.events || [];
            const sorted = [...data].sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
            setEvents(sorted);

            if (userId) {
                const checks = sorted.map(async (ev) => {
                    try {
                        const pr = await api.get(`events/${ev.id}/participants`);
                        const list = Array.isArray(pr.data) ? pr.data : [];
                        if (list.some((p) => p.id === userId || p.id === String(userId))) return ev.id;
                    } catch { }
                    return null;
                });
                const results = await Promise.all(checks);
                setRsvpedIds(new Set(results.filter(Boolean)));
            }
        } catch { } finally { setLoading(false); setRefreshing(false); }
    }, [userId]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const now = new Date();
    const filtered = events.filter((ev) => {
        const q = search.toLowerCase();
        const matchSearch = !q || ev.title?.toLowerCase().includes(q) || ev.location?.toLowerCase().includes(q);
        const matchFilter = filter === 'all' ? true
            : filter === 'upcoming' ? new Date(ev.eventDate) > now
                : new Date(ev.eventDate) <= now;
        return matchSearch && matchFilter;
    });

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id || String(Math.random())}
                renderItem={({ item }) => (
                    <EventCard event={item} isRsvped={rsvpedIds.has(item.id)} navigation={navigation} />
                )}
                ListHeaderComponent={
                    <View style={{ paddingBottom: spacing.md }}>
                        <View style={styles.searchRow}>
                            <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: spacing.xs }} />
                            <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
                                placeholder="Search events..." placeholderTextColor={colors.textMuted} />
                        </View>
                        {/* Filter tabs */}
                        <View style={styles.filterRow}>
                            {['all', 'upcoming', 'past'].map((f) => (
                                <TouchableOpacity key={f} onPress={() => setFilter(f)}
                                    style={[styles.filterBtn, filter === f && styles.filterBtnActive]}>
                                    <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateEvent')}>
                            <Ionicons name="add-circle-outline" size={18} color="#000" />
                            <Text style={styles.createBtnText}>New Event</Text>
                        </TouchableOpacity>
                    </View>
                }
                ListEmptyComponent={
                    loading
                        ? <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
                        : <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
                            <Text style={[typography.body, { marginTop: spacing.md }]}>No events</Text>
                        </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} />
                }
                contentContainerStyle={{ padding: spacing.md }}
                ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' },
    dateBox: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)', alignItems: 'center', justifyContent: 'center' },
    dateDay: { color: colors.primary, fontWeight: '800', fontSize: 16, lineHeight: 18 },
    dateMonth: { color: 'rgba(34,197,94,0.7)', fontSize: 10, fontWeight: '600' },
    title: { color: colors.text, fontWeight: '700', fontSize: 15 },
    creator: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
    badges: { alignItems: 'flex-end', gap: 4 },
    badgeGreen: { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
    badgeGreenText: { color: colors.primary, fontSize: 10, fontWeight: '600' },
    badgeGray: { backgroundColor: colors.surfaceElevated, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.border },
    badgeGrayText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
    goingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    goingText: { color: colors.primary, fontSize: 10, fontWeight: '600' },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xs },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { color: colors.textSecondary, fontSize: 12 },
    description: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: spacing.xs },
    searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
    searchInput: { flex: 1, height: 44, color: colors.text, fontSize: 14 },
    filterRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
    filterBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    filterBtnActive: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: colors.primary },
    filterText: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
    filterTextActive: { color: colors.primary, fontWeight: '700' },
    createBtn: { backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.sm },
    createBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
});
