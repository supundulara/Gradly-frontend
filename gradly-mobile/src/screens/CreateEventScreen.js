import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/colors';
import api from '../api/axios';

export default function CreateEventScreen({ navigation }) {
    const [form, setForm] = useState({ title: '', location: '', eventDate: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);

    const set = (key) => (val) => { setForm((p) => ({ ...p, [key]: val })); if (error) setError(''); };

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.eventDate.trim()) {
            setError('Title and event date are required.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                location: form.location.trim() || undefined,
                eventDate: new Date(form.eventDate).toISOString(),
            };
            Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
            const res = await api.post('events', payload);
            setSuccess(res.data);
            setTimeout(() => navigation.navigate('EventDetail', { eventId: res.data?.id || '' }), 1500);
        } catch (err) {
            const d = err.response?.data;
            setError((typeof d === 'string' ? d : d?.message || d?.error) || 'Failed to create event.');
        } finally { setLoading(false); }
    };

    if (success) {
        return (
            <View style={styles.centered}>
                <Ionicons name="checkmark-circle" size={52} color={colors.primary} />
                <Text style={[typography.h2, { marginTop: spacing.md }]}>Event created!</Text>
                <Text style={[typography.body, { marginTop: spacing.xs }]}>{success.title}</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
                <Text style={[typography.h2, { marginBottom: spacing.xs }]}>Create an Event</Text>
                <Text style={[typography.body, { marginBottom: spacing.xl }]}>Bring your community together</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Event Title *</Text>
                    <TextInput style={styles.input} value={form.title} onChangeText={set('title')}
                        placeholder="e.g. AI Workshop, Hackathon Kickoff" placeholderTextColor={colors.textMuted} />

                    <Text style={styles.label}>Location</Text>
                    <TextInput style={styles.input} value={form.location} onChangeText={set('location')}
                        placeholder="e.g. CE Auditorium, Online / Zoom" placeholderTextColor={colors.textMuted} />

                    <Text style={styles.label}>Event Date & Time * (YYYY-MM-DDThh:mm)</Text>
                    <TextInput style={styles.input} value={form.eventDate} onChangeText={set('eventDate')}
                        placeholder="2026-04-01T10:00" placeholderTextColor={colors.textMuted} />

                    <Text style={styles.label}>Description</Text>
                    <TextInput style={[styles.input, styles.textarea]} value={form.description} onChangeText={set('description')}
                        placeholder="What's this event about? Who should attend?" placeholderTextColor={colors.textMuted}
                        multiline numberOfLines={5} textAlignVertical="top" />

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
                        {loading
                            ? <ActivityIndicator color="#000" size="small" />
                            : <><Text style={styles.btnText}>Create Event</Text><Ionicons name="arrow-forward" size={16} color="#000" /></>}
                    </TouchableOpacity>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
    label: { ...typography.label, marginBottom: spacing.xs, marginTop: spacing.sm },
    input: {
        backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
        borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
        color: colors.text, fontSize: 14, marginBottom: spacing.xs,
    },
    textarea: { height: 120, textAlignVertical: 'top' },
    errorText: { color: colors.error, fontSize: 13, marginTop: spacing.sm },
    btn: { backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.lg },
    btnText: { color: '#000', fontWeight: '700', fontSize: 15 },
});
