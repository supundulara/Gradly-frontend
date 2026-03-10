import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/colors';
import api from '../api/axios';

const DEPARTMENTS = [
    'Computer Engineering', 'Electrical Engineering', 'Civil Engineering',
    'Mechanical Engineering', 'Information Technology', 'Business Administration', 'Other',
];

const YEARS = Array.from({ length: 10 }, (_, i) => String(2018 + i));

export default function RegisterScreen({ navigation }) {
    const [form, setForm] = useState({
        name: '', email: '', password: '', role: 'student',
        department: '', graduationYear: '', bio: '',
    });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

    const handleRegister = async () => {
        if (!form.name.trim() || !form.email.trim() || !form.password) {
            setError('Name, email and password are required.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const payload = {
                name: form.name.trim(), email: form.email.trim(), password: form.password,
                role: form.role,
                department: form.department || undefined,
                graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined,
                bio: form.bio.trim() || undefined,
            };
            Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
            await api.post('users/auth/register', payload);
            setSuccess(true);
            setTimeout(() => navigation.navigate('Login'), 2000);
        } catch (err) {
            const d = err.response?.data;
            setError((typeof d === 'string' ? d : d?.message || d?.error) || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <View style={styles.successContainer}>
                <View style={styles.successBox}>
                    <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
                    <Text style={[typography.h2, { marginTop: spacing.md }]}>Registered!</Text>
                    <Text style={[typography.body, { marginTop: spacing.xs }]}>Redirecting to login...</Text>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.logoRow}>
                    <View style={styles.logoBox}>
                        <Ionicons name="flash" size={22} color="#000" />
                    </View>
                    <Text style={styles.logoText}>Grad<Text style={styles.logoAccent}>ly</Text></Text>
                </View>
                <Text style={styles.title}>Create account</Text>
                <Text style={styles.subtitle}>Join the Gradly community</Text>

                <View style={styles.card}>
                    {/* Name */}
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput style={styles.input} value={form.name} onChangeText={set('name')}
                        placeholder="Your name" placeholderTextColor={colors.textMuted} />

                    {/* Email */}
                    <Text style={styles.label}>Email *</Text>
                    <TextInput style={styles.input} value={form.email} onChangeText={set('email')}
                        placeholder="you@university.edu" placeholderTextColor={colors.textMuted}
                        keyboardType="email-address" autoCapitalize="none" />

                    {/* Password */}
                    <Text style={styles.label}>Password *</Text>
                    <View style={styles.pwRow}>
                        <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={form.password} onChangeText={set('password')}
                            placeholder="Min. 8 characters" placeholderTextColor={colors.textMuted}
                            secureTextEntry={!showPw} />
                        <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                            <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* Role */}
                    <Text style={[styles.label, { marginTop: spacing.md }]}>Role *</Text>
                    <View style={styles.roleRow}>
                        {['student', 'alumni'].map((r) => (
                            <TouchableOpacity key={r} onPress={() => set('role')(r)}
                                style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}>
                                <Ionicons
                                    name={r === 'student' ? 'school' : 'briefcase'}
                                    size={16} color={form.role === r ? colors.primary : colors.textMuted} />
                                <Text style={[styles.roleBtnText, form.role === r && styles.roleBtnTextActive]}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Department */}
                    <Text style={[styles.label, { marginTop: spacing.md }]}>Department</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
                        {DEPARTMENTS.map((d) => (
                            <TouchableOpacity key={d} onPress={() => set('department')(d)}
                                style={[styles.chip, form.department === d && styles.chipActive]}>
                                <Text style={[styles.chipText, form.department === d && styles.chipTextActive]}>{d}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Grad Year */}
                    <Text style={styles.label}>Graduation Year</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
                        {YEARS.map((y) => (
                            <TouchableOpacity key={y} onPress={() => set('graduationYear')(y)}
                                style={[styles.chip, form.graduationYear === y && styles.chipActive]}>
                                <Text style={[styles.chipText, form.graduationYear === y && styles.chipTextActive]}>{y}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Bio */}
                    <Text style={styles.label}>Bio</Text>
                    <TextInput style={[styles.input, styles.textarea]} value={form.bio} onChangeText={set('bio')}
                        placeholder="Tell us a bit about yourself..." placeholderTextColor={colors.textMuted}
                        multiline numberOfLines={3} textAlignVertical="top" />

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity style={[styles.btnPrimary, loading && styles.btnDisabled]}
                        onPress={handleRegister} disabled={loading}>
                        {loading
                            ? <ActivityIndicator color="#000" size="small" />
                            : <Text style={styles.btnPrimaryText}>Create Account</Text>}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchRow}>
                    <Text style={styles.switchText}>Already have an account? </Text>
                    <Text style={[styles.switchText, styles.switchAccent]}>Sign In</Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: { flexGrow: 1, padding: spacing.xl },
    successContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    successBox: { alignItems: 'center' },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xxl, marginTop: spacing.xxl },
    logoBox: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    logoText: { fontSize: 22, fontWeight: '800', color: colors.text },
    logoAccent: { color: colors.primary },
    title: { ...typography.h1, marginBottom: spacing.xs },
    subtitle: { ...typography.body, marginBottom: spacing.xxl },
    card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
    label: { ...typography.label, marginBottom: spacing.xs },
    input: {
        backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
        borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
        color: colors.text, fontSize: 15, marginBottom: spacing.sm,
    },
    textarea: { height: 80, textAlignVertical: 'top' },
    pwRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
    eyeBtn: { padding: spacing.sm },
    roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    roleBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: spacing.xs, paddingVertical: 10, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated,
    },
    roleBtnActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.1)' },
    roleBtnText: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
    roleBtnTextActive: { color: colors.primary },
    chip: {
        paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full,
        borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated,
        marginRight: spacing.xs,
    },
    chipActive: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: colors.primary },
    chipText: { color: colors.textMuted, fontSize: 12 },
    chipTextActive: { color: colors.primary, fontWeight: '600' },
    errorText: { color: colors.error, fontSize: 13, marginBottom: spacing.sm },
    btnPrimary: {
        backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: 14,
        alignItems: 'center', marginTop: spacing.sm,
    },
    btnDisabled: { opacity: 0.6 },
    btnPrimaryText: { color: '#000', fontWeight: '700', fontSize: 15 },
    switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
    switchText: { ...typography.body, fontSize: 14 },
    switchAccent: { color: colors.primary, fontWeight: '600' },
});
