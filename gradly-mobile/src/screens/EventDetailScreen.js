import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography } from '../theme/colors';
import api from '../api/axios';

function formatDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }) + ' at ' + new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function EventDetailScreen({ route, navigation }) {
    const { eventId } = route.params;
    const { userId } = useAuth();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rsvped, setRsvped] = useState(false);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [rsvpError, setRsvpError] = useState('');

    const fetchParticipants = useCallback(async () => {
        try {
            const res = await api.get(`events/${eventId}/participants`);
            const list = Array.isArray(res.data) ? res.data : [];
            setParticipants(list);
            if (userId) setRsvped(list.some((p) => p.id === userId || p.id === String(userId)));
        } catch { }
    }, [eventId, userId]);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`events/${eventId}`);
                setEvent(res.data);
            } catch (err) {
                const d = err.response?.data;
                setError((typeof d === 'string' ? d : d?.message) || 'Event not found.');
            } finally { setLoading(false); }
        };
        fetchEvent();
        fetchParticipants();
    }, [eventId, fetchParticipants]);

    const handleRsvp = async () => {
        if (rsvpLoading) return;
        setRsvpLoading(true);
        setRsvpError('');
        const was = rsvped;
        setRsvped(!was);
        try {
            if (was) await api.delete(`events/${eventId}/rsvp`);
            else await api.post(`events/${eventId}/rsvp`);
            await fetchParticipants();
        } catch (err) {
            setRsvped(was);
            const d = err.response?.data;
            setRsvpError((typeof d === 'string' ? d : d?.message) || 'RSVP failed.');
        } finally { setRsvpLoading(false); }
    };

    const isUpcoming = event?.eventDate && new Date(event.eventDate) > new Date();
    const isOrganizer = event && userId && (event.createdBy === userId || event.createdBy === String(userId));

    if (loading) return <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>;
    if (error || !event) return (
        <View style={styles.centered}>
            <Text style={{ color: colors.error, marginBottom: spacing.md }}>{error}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.ghostBtn}>
                <Text style={styles.ghostBtnText}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{event.title}</Text>
                    {event.creatorName && <Text style={styles.creator}>by {event.creatorName}</Text>}
                </View>
                {isUpcoming
                    ? <View style={styles.badgeGreen}><Text style={styles.badgeGreenText}>Upcoming</Text></View>
                    : <View style={styles.badgeGray}><Text style={styles.badgeGrayText}>Past</Text></View>}
            </View>

            {/* Meta */}
            <View style={styles.metaCard}>
                {event.location && (
                    <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={15} color={colors.textMuted} />
                        <Text style={styles.metaText}>{event.location}</Text>
                    </View>
                )}
                {event.eventDate && (
                    <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
                        <Text style={styles.metaText}>{formatDate(event.eventDate)}</Text>
                    </View>
                )}
                <View style={styles.metaRow}>
                    <Ionicons name="people-outline" size={15} color={colors.textMuted} />
                    <Text style={styles.metaText}>{participants.length} participant{participants.length !== 1 ? 's' : ''}</Text>
                </View>
            </View>

            {/* Description */}
            {event.description && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About this event</Text>
                    <Text style={styles.description}>{event.description}</Text>
                </View>
            )}

            {/* RSVP */}
            <View style={styles.rsvpSection}>
                {isOrganizer ? (
                    <Text style={{ color: colors.textMuted, fontSize: 14 }}>You organised this event.</Text>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[
                                styles.rsvpBtn,
                                rsvped && styles.rsvpBtnCancel,
                                (rsvpLoading || !isUpcoming) && { opacity: 0.6 },
                            ]}
                            onPress={handleRsvp}
                            disabled={rsvpLoading || !isUpcoming}
                        >
                            {rsvpLoading
                                ? <ActivityIndicator color={rsvped ? colors.textSecondary : '#000'} size="small" />
                                : <>
                                    <Ionicons
                                        name={rsvped ? 'person-remove-outline' : 'person-add-outline'}
                                        size={18}
                                        color={rsvped ? colors.textSecondary : '#000'}
                                    />
                                    <Text style={[styles.rsvpBtnText, rsvped && { color: colors.textSecondary }]}>
                                        {rsvped ? 'Cancel RSVP' : 'RSVP to this Event'}
                                    </Text>
                                </>
                            }
                        </TouchableOpacity>
                        {rsvped && !rsvpLoading && (
                            <View style={styles.goingRow}>
                                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>You're going!</Text>
                            </View>
                        )}
                        {!isUpcoming && <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: spacing.xs }}>This event has ended.</Text>}
                        {rsvpError ? <Text style={{ color: colors.error, marginTop: spacing.sm }}>{rsvpError}</Text> : null}
                    </>
                )}
            </View>

            {/* Participants */}
            <View style={styles.participantsSection}>
                <Text style={styles.sectionTitle}>Participants</Text>
                {participants.length === 0 ? (
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>No participants yet. Be the first to RSVP!</Text>
                ) : (
                    <View style={styles.participantsList}>
                        {participants.map((p, idx) => (
                            <View key={p.id || idx} style={styles.participantChip}>
                                <View style={styles.participantAvatar}>
                                    <Text style={styles.participantInitial}>{(p.name || 'U').charAt(0).toUpperCase()}</Text>
                                </View>
                                <Text style={styles.participantName}>{p.name || p.id}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    headerRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginBottom: spacing.lg },
    title: { ...typography.h2, fontSize: 22, marginBottom: spacing.xs },
    creator: { color: colors.textSecondary, fontSize: 13 },
    badgeGreen: { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
    badgeGreenText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
    badgeGray: { backgroundColor: colors.surfaceElevated, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.border },
    badgeGrayText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
    metaCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, gap: spacing.sm },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    metaText: { color: colors.textSecondary, fontSize: 13 },
    section: { marginBottom: spacing.xl },
    sectionTitle: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: spacing.sm },
    description: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
    rsvpSection: { marginBottom: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
    rsvpBtn: { backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    rsvpBtnCancel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    rsvpBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
    goingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
    participantsSection: { paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, marginBottom: spacing.md },
    participantsList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
    participantChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surface, borderRadius: radius.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.border },
    participantAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center' },
    participantInitial: { color: colors.primary, fontWeight: '700', fontSize: 10 },
    participantName: { color: colors.text, fontSize: 13, fontWeight: '500' },
    ghostBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, paddingVertical: 10, paddingHorizontal: spacing.xl },
    ghostBtnText: { color: colors.textSecondary, fontWeight: '600' },
});
