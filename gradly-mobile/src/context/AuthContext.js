import { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64).split('').map((c) =>
                '%' + c.charCodeAt(0).toString(16).padStart(2, '0')
            ).join('')
        );
        return JSON.parse(json);
    } catch { return {}; }
}

function extractRole(claims) {
    if (typeof claims.role === 'string') return claims.role.toLowerCase();
    const arr = claims.roles || claims.authorities || claims.scope;
    if (Array.isArray(arr) && arr.length > 0) {
        const first = arr[0];
        return (typeof first === 'string' ? first : first?.authority || '')
            .replace(/^ROLE_/i, '').toLowerCase() || null;
    }
    return null;
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [loaded, setLoaded] = useState(false);

    // Load token from storage on mount
    const loadToken = useCallback(async () => {
        try {
            const t = await AsyncStorage.getItem('token');
            setToken(t);
        } catch (e) {
            console.error('Failed to load token', e);
        } finally {
            setLoaded(true);
        }
    }, []);

    const login = useCallback(async (newToken) => {
        await AsyncStorage.setItem('token', newToken);
        setToken(newToken);
    }, []);

    const logout = useCallback(async () => {
        await AsyncStorage.removeItem('token');
        setToken(null);
    }, []);

    const claims = token ? decodeToken(token) : {};
    const role = extractRole(claims);
    const userId = claims.sub || claims.userId || claims.id || null;
    const userName = claims.name || claims.username || null;
    const isAuthenticated = !!token;

    const isStudent = role === 'student';
    const isAlumni = role === 'alumni';
    const isAdmin = role === 'admin';
    const canPostJob = isAlumni || isAdmin;
    const canApplyJob = isStudent || isAlumni;

    return (
        <AuthContext.Provider value={{
            token, role, userId, userName, isAuthenticated,
            isStudent, isAlumni, isAdmin, canPostJob, canApplyJob,
            loaded, loadToken, login, logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
