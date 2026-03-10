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

function timeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function formatDeadline(ts) {
    if (!ts) return null;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function JobCard({ job, isApplied, onApply, navigation }) {
    const { canApplyJob, userId } = useAuth();
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(isApplied);

    const isOwner = userId && (job.postedBy === userId || job.postedBy === String(userId));
    const isExpired = job.deadline && new Date(job.deadline) < Date.now();
    const showApply = canApplyJob && !isOwner && !isExpired;

    const handleApply = async () => {
        if (applying || applied) return;
        setApplying(true);
        try {
            await api.post(`jobs/${job.id}/apply`);
            setApplied(true);
            onApply?.(job.id);
        } catch { } finally { setApplying(false); }
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
            activeOpacity={0.85}
        >
            <View style={styles.cardHeader}>
                <View style={styles.companyIcon}>
                    <Text style={styles.companyInitial}>{(job.company || 'C').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                    <Text style={styles.company}>{job.company}</Text>
                </View>
                <Text style={styles.timeAgo}>{timeAgo(job.createdAt)}</Text>
            </View>

            <View style={styles.metaRow}>
                {job.location && (
                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                        <Text style={styles.metaText}>{job.location}</Text>
                    </View>
                )}
                {job.deadline && (
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={12} color={isExpired ? colors.error : colors.textMuted} />
                        <Text style={[styles.metaText, isExpired && { color: colors.error }]}>
                            {isExpired ? 'Expired ' : ''}{formatDeadline(job.deadline)}
                        </Text>
                    </View>
                )}
            </View>

            {job.description ? (
                <Text style={styles.description} numberOfLines={2}>{job.description}</Text>
            ) : null}

            <View style={styles.cardFooter}>
                <Text style={styles.postedBy}>{job.postedByName ? `by ${job.postedByName}` : ''}</Text>
                <View style={styles.footerActions}>
                    {showApply && (
                        applied ? (
                            <View style={styles.appliedBadge}>
                                <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
                                <Text style={styles.appliedText}>Applied</Text>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} disabled={applying}>
                                {applying
                                    ? <ActivityIndicator color="#000" size="small" />
                                    : <Text style={styles.applyBtnText}>Apply</Text>}
                            </TouchableOpacity>
                        )
                    )}
                    {isExpired && (
                        <View style={styles.closedBadge}><Text style={styles.closedText}>Closed</Text></View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function JobsScreen({ navigation }) {
    const { canPostJob, canApplyJob } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [appliedIds, setAppliedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetch = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const [jobsRes] = await Promise.all([api.get('jobs')]);
            const data = Array.isArray(jobsRes.data) ? jobsRes.data
                : jobsRes.data?.content || jobsRes.data?.jobs || [];
            setJobs([...data].reverse());
            if (canApplyJob) {
                try {
                    const ar = await api.get('jobs/applications/me');
                    setAppliedIds((Array.isArray(ar.data) ? ar.data : []).map((a) => a.jobId));
                } catch { }
            }
        } catch { } finally { setLoading(false); setRefreshing(false); }
    }, [canApplyJob]);

    useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

    const filtered = jobs.filter((j) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return j.title?.toLowerCase().includes(q) || j.company?.toLowerCase().includes(q) ||
            j.location?.toLowerCase().includes(q);
    });

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id || String(Math.random())}
                renderItem={({ item }) => (
                    <JobCard
                        job={item}
                        isApplied={appliedIds.includes(item.id)}
                        onApply={(id) => setAppliedIds((p) => [...p, id])}
                        navigation={navigation}
                    />
                )}
                ListHeaderComponent={
                    <View style={{ paddingBottom: spacing.md }}>
                        {/* Search */}
                        <View style={styles.searchRow}>
                            <Ionicons name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                value={search}
                                onChangeText={setSearch}
                                placeholder="Search jobs..."
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        {canPostJob && (
                            <TouchableOpacity style={styles.postJobBtn} onPress={() => navigation.navigate('CreateJob')}>
                                <Ionicons name="add-circle-outline" size={18} color="#000" />
                                <Text style={styles.postJobBtnText}>Post a Job</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    loading
                        ? <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
                        : <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <Ionicons name="briefcase-outline" size={32} color={colors.textMuted} />
                            <Text style={[typography.body, { marginTop: spacing.md }]}>No jobs yet</Text>
                        </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetch(true)} tintColor={colors.primary} />
                }
                contentContainerStyle={{ padding: spacing.md }}
                ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
    companyIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)', alignItems: 'center', justifyContent: 'center' },
    companyInitial: { color: colors.primary, fontWeight: '800', fontSize: 16 },
    jobTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
    company: { color: colors.textSecondary, fontSize: 13, marginTop: 1 },
    timeAgo: { color: colors.textMuted, fontSize: 11 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.sm },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { color: colors.textSecondary, fontSize: 12 },
    description: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: spacing.sm },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
    postedBy: { color: colors.textMuted, fontSize: 11 },
    footerActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    applyBtn: { backgroundColor: colors.primary, borderRadius: radius.xl, paddingHorizontal: 16, paddingVertical: 7 },
    applyBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
    appliedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
    appliedText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
    closedBadge: { backgroundColor: colors.surfaceElevated, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.border },
    closedText: { color: colors.textMuted, fontSize: 12 },
    searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, marginBottom: spacing.md },
    searchIcon: { marginRight: spacing.xs },
    searchInput: { flex: 1, height: 44, color: colors.text, fontSize: 14 },
    postJobBtn: { backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.sm },
    postJobBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
});
