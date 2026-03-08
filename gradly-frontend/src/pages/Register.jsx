import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

const DEPARTMENTS = [
    'Computer Engineering',
    'Computer Science',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Information Technology',
    'Business Administration',
    'Data Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Other',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR + i - 2);

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
        department: '',
        graduationYear: '',
        bio: '',
    });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) {
            setError('Please fill in all required fields.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const payload = {
                ...form,
                graduationYear: form.graduationYear ? parseInt(form.graduationYear, 10) : undefined,
            };
            if (!payload.graduationYear) delete payload.graduationYear;

            await api.post('users/auth/register', payload);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            const data = err.response?.data;
            setError(
                (typeof data === 'string' ? data : data?.message || data?.error) ||
                'Registration failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="text-center animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-text mb-1">You're all set!</h2>
                    <p className="text-text-secondary text-sm">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md animate-fade-in relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                        <Zap className="w-6 h-6 text-primary fill-current" />
                    </div>
                    <h1 className="text-2xl font-bold text-text">Join Gradly</h1>
                    <p className="text-text-secondary text-sm mt-1">Create your student or alumni account</p>
                </div>

                {/* Card */}
                <div className="card p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name & Email row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="label">
                                    Full Name <span className="text-error">*</span>
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Supun Silva"
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="reg-email" className="label">
                                    Email <span className="text-error">*</span>
                                </label>
                                <input
                                    id="reg-email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="you@uni.edu"
                                    className="input-field"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="reg-password" className="label">
                                Password <span className="text-error">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="reg-password"
                                    name="password"
                                    type={showPw ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Create a strong password"
                                    className="input-field pr-11"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                                >
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Role */}
                        <div>
                            <label className="label">Role</label>
                            <div className="flex gap-2">
                                {['student', 'alumni'].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setForm((prev) => ({ ...prev, role: r }))}
                                        className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all duration-200 capitalize ${form.role === r
                                            ? 'bg-primary/10 border-primary/40 text-primary'
                                            : 'bg-surface-elevated border-border text-text-secondary hover:border-border hover:text-text'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Department & Year */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="department" className="label">Department</label>
                                <select
                                    id="department"
                                    name="department"
                                    value={form.department}
                                    onChange={handleChange}
                                    className="input-field appearance-none cursor-pointer"
                                >
                                    <option value="">Select department</option>
                                    {DEPARTMENTS.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="graduationYear" className="label">Graduation Year</label>
                                <select
                                    id="graduationYear"
                                    name="graduationYear"
                                    value={form.graduationYear}
                                    onChange={handleChange}
                                    className="input-field appearance-none cursor-pointer"
                                >
                                    <option value="">Select year</option>
                                    {YEARS.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label htmlFor="bio" className="label">Bio <span className="text-text-muted">(optional)</span></label>
                            <textarea
                                id="bio"
                                name="bio"
                                value={form.bio}
                                onChange={handleChange}
                                placeholder="Tell us about yourself..."
                                rows={2}
                                className="input-field resize-none"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 pop-in">
                                <p className="text-error text-sm">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            id="register-btn"
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Create account
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-text-muted text-sm mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:text-primary-light font-medium transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
