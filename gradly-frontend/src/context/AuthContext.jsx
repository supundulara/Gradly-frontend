import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

/**
 * Safely decode the JWT payload (base64url → JSON) without any library.
 * Returns {} if the token is malformed.
 */
function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        // base64url → base64 → JSON
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join('')
        );
        return JSON.parse(json);
    } catch {
        return {};
    }
}

/**
 * Extract the role string from the decoded JWT payload.
 * Spring Boot commonly uses: role, roles, authorities, ROLE_xxx claim.
 */
function extractRole(claims) {
    // Direct role field
    if (typeof claims.role === 'string') return claims.role.toLowerCase();
    // Array of roles/authorities (Spring Security default)
    const arr = claims.roles || claims.authorities || claims.scope;
    if (Array.isArray(arr) && arr.length > 0) {
        const first = arr[0];
        // Strip "ROLE_" prefix if present
        const r = (typeof first === 'string' ? first : first?.authority || '')
            .replace(/^ROLE_/i, '')
            .toLowerCase();
        return r || null;
    }
    // Comma-separated scope string
    if (typeof arr === 'string') return arr.split(' ')[0].replace(/^ROLE_/i, '').toLowerCase();
    return null;
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'));

    // Derive user claims directly from token (always in sync, no extra state)
    const claims = token ? decodeToken(token) : {};
    const role = extractRole(claims);       // 'student' | 'alumni' | 'admin' | null
    const userId = claims.sub || claims.userId || claims.id || null;
    const userName = claims.name || claims.username || null;

    const login = useCallback((newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
    }, []);

    // Convenience role helpers
    const isStudent = role === 'student';
    const isAlumni = role === 'alumni';
    const isAdmin = role === 'admin';
    const canPostJob = isAlumni || isAdmin;       // alumni + admin
    const canApplyJob = isStudent || isAlumni;    // student + alumni
    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{
            token,
            role,
            userId,
            userName,
            isAuthenticated,
            isStudent,
            isAlumni,
            isAdmin,
            canPostJob,
            canApplyJob,
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
