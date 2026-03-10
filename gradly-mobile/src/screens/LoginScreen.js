import { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography } from '../theme/colors';
import api from '../api/axios';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await api.post('users/auth/login', { email: email.trim(), password });
            const token = res.data?.token || res.data?.accessToken || res.data;
            if (typeof token === 'string') {
                await login(token);
            } else {
                setError('Unexpected response from server.');
            }
        } catch (err) {
            const d = err.response?.data;
            setError((typeof d === 'string' ? d : d?.message || d?.error) || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo */}
                <View style={styles.logoRow}>
                    <View style={styles.logoBox}>
                        <Ionicons name="flash" size={22} color="#000" />
                    </View>
                    <Text style={styles.logoText}>Grad<Text style={styles.logoAccent}>ly</Text></Text>
                </View>

                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>

                {/* Form */}
                <View style={styles.card}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@university.edu"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />

                    <Text style={[styles.label, { marginTop: spacing.md }]}>Password</Text>
                    <View style={styles.pwRow}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            placeholderTextColor={colors.textMuted}
                            secureTextEntry={!showPw}
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                        />
                        <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                            <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.btnPrimary, loading && styles.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#000" size="small" />
                            : <Text style={styles.btnPrimaryText}>Sign In</Text>
                        }
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.switchRow}>
                    <Text style={styles.switchText}>Don't have an account? </Text>
                    <Text style={[styles.switchText, styles.switchAccent]}>Register</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xxl },
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
    pwRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
    eyeBtn: { padding: spacing.sm },
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
