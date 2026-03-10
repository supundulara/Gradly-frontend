import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/colors';
import api from '../api/axios';

export default function CreateJobScreen({ navigation }) {
    const [form, setForm] = useState({ title: '', company: '', location: '', deadline: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const set = (key) => (val) => { setForm((p) => ({ ...p, [key]: val })); if (error) setError(''); };

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.company.trim() || !form.description.trim()) {
            setError('Title, company and description are required.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const payload = {
                title: form.title.trim(), company: form.company.trim(),
                description: form.description.trim(),
                location: form.location.trim() || undefined,
                deadline: form.deadline.trim() ? new Date(form.deadline).toISOString() : undefined,
            };
            Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
            await api.post('jobs', payload);
            setSuccess(true);
            setTimeout(() => navigation.navigate('JobsList'), 1500);
        } catch (err) {
            const d = err.response?.data;
            setError((typeof d === 'string' ? d : d?.message || d?.error) || 'Failed to post job.');
        } finally { setLoading(false); }
    };

    if (success) {
        return (
            <View style={styles.centered}>
                <Ionicons name="checkmark-circle" size={52} color={colors.primary} />
                <Text style={[typography.h2, { marginTop: spacing.md }]}>Job posted!</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
                <Text style={[typography.h2, { marginBottom: spacing.xs }]}>Post an Opportunity</Text>
                <Text style={[typography.body, { marginBottom: spacing.xl }]}>Share with the Gradly community</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Job Title *</Text>
                    <TextInput style={styles.input} value={form.title} onChangeText={set('title')}
                        placeholder="e.g. Backend Engineer Intern" placeholderTextColor={colors.textMuted} />

                    <Text style={styles.label}>Company *</Text>
                    <TextInput style={styles.input} value={form.company} onChangeText={set('company')}
                        placeholder="e.g. WSO2" placeholderTextColor={colors.textMuted} />

                    <Text style={styles.label}>Location</Text>
                    <TextInput style={styles.input} value={form.location} onChangeText={set('location')}
                        placeholder="e.g. Colombo / Remote" placeholderTextColor={colors.textMuted} />

                    <Text style={styles.label}>Deadline (YYYY-MM-DD)</Text>
                    <TextInput style={styles.input} value={form.deadline} onChangeText={set('deadline')}
                        placeholder="2026-05-01" placeholderTextColor={colors.textMuted} />

                    <Text style={styles.label}>Description *</Text>
                    <TextInput style={[styles.input, styles.textarea]} value={form.description} onChangeText={set('description')}
                        placeholder="Describe the role, requirements, perks..." placeholderTextColor={colors.textMuted}
                        multiline numberOfLines={5} textAlignVertical="top" />

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
                        {loading
                            ? <ActivityIndicator color="#000" size="small" />
                            : <><Text style={styles.btnText}>Post Job</Text><Ionicons name="arrow-forward" size={16} color="#000" /></>}
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
