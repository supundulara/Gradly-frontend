import { useState, useEffect } from 'react';
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
    return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function JobDetailScreen({ route, navigation }) {
    const { jobId } = route.params;
    const { canApplyJob, userId } = useAuth();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [applied, setApplied] = useState(false);
    const [applying, setApplying] = useState(false);
    const [applyError, setApplyError] = useState('');

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await api.get(`jobs/${jobId}`);
                setJob(res.data);
            } catch (err) {
                const d = err.response?.data;
                setError((typeof d === 'string' ? d : d?.message || d?.error) || 'Job not found.');
            } finally { setLoading(false); }
        };
        const checkApplied = async () => {
            if (!canApplyJob) return;
            try {
                const res = await api.get('jobs/applications/me');
                const ids = (Array.isArray(res.data) ? res.data : []).map((a) => a.jobId);
                setApplied(ids.includes(jobId));
            } catch { }
        };
        fetchJob();
        checkApplied();
    }, [jobId, canApplyJob]);

    const isOwner = userId && job && (job.postedBy === userId || job.postedBy === String(userId));
    const isExpired = job?.deadline && new Date(job.deadline) < Date.now();
    const showApply = canApplyJob && !isOwner && !isExpired;

    const handleApply = async () => {
        if (applying || applied) return;
        setApplying(true);
        setApplyError('');
        try {
            await api.post(`jobs/${jobId}/apply`);
            setApplied(true);
        } catch (err) {
            const d = err.response?.data;
            setApplyError((typeof d === 'string' ? d : d?.message || d?.error) || 'Failed to apply.');
        } finally { setApplying(false); }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={colors.primary} size="large" />
            </View>
        );
    }

    if (error || !job) {
        return (
            <View style={styles.centered}>
                <Text style={{ color: colors.error, marginBottom: spacing.md }}>{error}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.ghostBtn}>
                    <Text style={styles.ghostBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
            {/* Company + Title */}
            <View style={styles.headerRow}>
                <View style={styles.companyIcon}>
                    <Text style={styles.companyInitial}>{(job.company || 'C').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{job.title}</Text>
                    <Text style={styles.company}>{job.company}</Text>
                </View>
            </View>

            {/* Meta */}
            <View style={styles.metaCard}>
                {job.location && (
                    <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={15} color={colors.textMuted} />
                        <Text style={styles.metaText}>{job.location}</Text>
                    </View>
                )}
                {job.deadline && (
                    <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={15} color={isExpired ? colors.error : colors.textMuted} />
                        <Text style={[styles.metaText, isExpired && { color: colors.error }]}>
                            {isExpired ? 'Expired' : 'Deadline'}: {formatDate(job.deadline)}
                        </Text>
                    </View>
                )}
                {job.postedByName && (
                    <View style={styles.metaRow}>
                        <Ionicons name="person-outline" size={15} color={colors.textMuted} />
                        <Text style={styles.metaText}>Posted by {job.postedByName}</Text>
                    </View>
                )}
            </View>

            {/* Description */}
            {job.description && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About this role</Text>
                    <Text style={styles.description}>{job.description}</Text>
                </View>
            )}

            {/* Apply */}
            <View style={styles.applySection}>
                {applied ? (
                    <View style={styles.appliedRow}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        <Text style={styles.appliedText}>You've successfully applied!</Text>
                    </View>
                ) : showApply ? (
                    <>
                        <TouchableOpacity
                            style={[styles.applyBtn, applying && { opacity: 0.6 }]}
                            onPress={handleApply}
                            disabled={applying}
                        >
                            {applying
                                ? <ActivityIndicator color="#000" size="small" />
                                : <Text style={styles.applyBtnText}>Apply Now</Text>}
                        </TouchableOpacity>
                        {applyError ? <Text style={{ color: colors.error, marginTop: spacing.sm }}>{applyError}</Text> : null}
                    </>
                ) : isExpired ? (
                    <Text style={{ color: colors.textMuted }}>This position is no longer accepting applications.</Text>
                ) : isOwner ? (
                    <Text style={{ color: colors.textMuted }}>You posted this job.</Text>
                ) : null}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    headerRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
    companyIcon: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)', alignItems: 'center', justifyContent: 'center' },
    companyInitial: { color: colors.primary, fontWeight: '800', fontSize: 22 },
    title: { ...typography.h2, fontSize: 18, marginBottom: 2 },
    company: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
    metaCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, gap: spacing.sm },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    metaText: { color: colors.textSecondary, fontSize: 13 },
    section: { marginBottom: spacing.xl },
    sectionTitle: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: spacing.sm },
    description: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
    applySection: { marginTop: spacing.md, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
    applyBtn: { backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: 14, alignItems: 'center' },
    applyBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
    appliedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    appliedText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
    ghostBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, paddingVertical: 10, paddingHorizontal: spacing.xl },
    ghostBtnText: { color: colors.textSecondary, fontWeight: '600' },
});
