import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Loader2, CheckCircle2 } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function CreateJob() {
    const { canPostJob } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '',
        company: '',
        description: '',
        location: '',
        deadline: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Guard — shouldn't reach this if router is configured, but just in case
    if (!canPostJob) {
        return (
            <Layout>
                <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
                    <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mx-auto mb-4">
                        <BriefcaseBusiness className="w-7 h-7 text-text-muted" />
                    </div>
                    <h2 className="text-lg font-bold text-text mb-2">Access Restricted</h2>
                    <p className="text-text-secondary text-sm mb-6">
                        Only alumni and admins can post job opportunities.
                    </p>
                    <Link to="/jobs" className="btn-ghost">← Back to Jobs</Link>
                </div>
            </Layout>
        );
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.company.trim() || !form.description.trim()) {
            setError('Please fill in all required fields.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const payload = {
                title: form.title.trim(),
                company: form.company.trim(),
                description: form.description.trim(),
                location: form.location.trim() || undefined,
                deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
            };
            // Remove undefined fields
            Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

            await api.post('jobs', payload);
            setSuccess(true);
            setTimeout(() => navigate('/jobs'), 2000);
        } catch (err) {
            const d = err.response?.data;
            setError((typeof d === 'string' ? d : d?.message || d?.error) || 'Failed to post job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Layout>
                <div className="min-h-[60vh] flex items-center justify-center px-4">
                    <div className="text-center animate-fade-in">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
                            <CheckCircle2 className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-text mb-1">Job posted!</h2>
                        <p className="text-text-secondary text-sm">Redirecting to jobs feed...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // Compute min date for deadline (today)
    const today = new Date().toISOString().split('T')[0];

    return (
        <Layout>
            <div className="max-w-xl mx-auto px-4 py-6">
                {/* Back */}
                <button onClick={() => navigate(-1)} className="btn-ghost mb-5 text-xs gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Jobs
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-text flex items-center gap-2">
                        <BriefcaseBusiness className="w-5 h-5 text-primary" />
                        Post an Opportunity
                    </h1>
                    <p className="text-text-muted text-xs mt-0.5">Share a job or internship with the Gradly community</p>
                </div>

                {/* Form */}
                <div className="card p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Title */}
                        <div>
                            <label htmlFor="job-title" className="label">
                                Job Title <span className="text-error">*</span>
                            </label>
                            <input
                                id="job-title"
                                name="title"
                                type="text"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="e.g. Backend Engineer Intern"
                                className="input-field"
                                required
                            />
                        </div>

                        {/* Company */}
                        <div>
                            <label htmlFor="job-company" className="label">
                                Company <span className="text-error">*</span>
                            </label>
                            <input
                                id="job-company"
                                name="company"
                                type="text"
                                value={form.company}
                                onChange={handleChange}
                                placeholder="e.g. WSO2"
                                className="input-field"
                                required
                            />
                        </div>

                        {/* Location + Deadline */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="job-location" className="label">Location</label>
                                <input
                                    id="job-location"
                                    name="location"
                                    type="text"
                                    value={form.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Colombo / Remote"
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label htmlFor="job-deadline" className="label">Application Deadline</label>
                                <input
                                    id="job-deadline"
                                    name="deadline"
                                    type="date"
                                    min={today}
                                    value={form.deadline}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="job-description" className="label">
                                Description <span className="text-error">*</span>
                            </label>
                            <textarea
                                id="job-description"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Describe the role, responsibilities, requirements, and any perks..."
                                rows={6}
                                className="input-field resize-none"
                                required
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 pop-in">
                                <p className="text-error text-sm">{error}</p>
                            </div>
                        )}

                        {/* Submit actions */}
                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => navigate('/jobs')}
                                className="btn-ghost flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                id="post-job-submit"
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex-1"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Post Job
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="h-16" />
            </div>
        </Layout>
    );
}
