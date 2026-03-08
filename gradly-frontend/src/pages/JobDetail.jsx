import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, CalendarDays, Clock, Building2,
    CheckCircle2, Loader2, User, BriefcaseBusiness
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function formatDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
}

export default function JobDetail() {
    const { jobId } = useParams();
    const navigate = useNavigate();
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
            } finally {
                setLoading(false);
            }
        };

        const checkApplied = async () => {
            if (!canApplyJob) return;
            try {
                const res = await api.get('jobs/applications/me');
                const ids = (Array.isArray(res.data) ? res.data : []).map((a) => a.jobId);
                setApplied(ids.includes(jobId));
            } catch { /* ignore */ }
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
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto px-4 py-10 flex justify-center">
                    <div className="loader w-6 h-6" />
                </div>
            </Layout>
        );
    }

    if (error || !job) {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto px-4 py-10 text-center">
                    <p className="text-error mb-4">{error || 'Job not found.'}</p>
                    <Link to="/jobs" className="btn-ghost">← Back to Jobs</Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Back */}
                <button onClick={() => navigate(-1)} className="btn-ghost mb-5 text-xs gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Jobs
                </button>

                {/* Main card */}
                <div className="card p-6 space-y-6 animate-fade-in">
                    {/* Company + title */}
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0 text-2xl font-bold text-primary">
                            {(job.company || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-text leading-tight">{job.title}</h1>
                            <p className="text-text-secondary font-medium mt-0.5">{job.company}</p>
                        </div>
                    </div>

                    {/* Meta grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {job.location && (
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <MapPin className="w-4 h-4 text-text-muted flex-shrink-0" />
                                <span>{job.location}</span>
                            </div>
                        )}
                        {job.deadline && (
                            <div className={`flex items-center gap-2 text-sm ${isExpired ? 'text-error' : 'text-text-secondary'}`}>
                                <CalendarDays className="w-4 h-4 text-text-muted flex-shrink-0" />
                                <span>{isExpired ? 'Closed' : 'Deadline'}: {formatDate(job.deadline)}</span>
                            </div>
                        )}
                        {job.createdAt && (
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <Clock className="w-4 h-4 text-text-muted flex-shrink-0" />
                                <span>Posted {formatDate(job.createdAt)}</span>
                            </div>
                        )}
                        {job.postedBy && (
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <User className="w-4 h-4 text-text-muted flex-shrink-0" />
                                <span>By {job.postedBy}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-border" />

                    {/* Description */}
                    <div>
                        <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                            <BriefcaseBusiness className="w-4 h-4 text-text-muted" />
                            About this role
                        </h2>
                        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                            {job.description}
                        </p>
                    </div>

                    {/* Apply CTA */}
                    <div className="border-t border-border pt-4">
                        {applied ? (
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <CheckCircle2 className="w-5 h-5" />
                                You've successfully applied for this position.
                            </div>
                        ) : showApply ? (
                            <div className="space-y-2">
                                <button
                                    id={`apply-btn-${job.id}`}
                                    onClick={handleApply}
                                    disabled={applying}
                                    className="btn-primary w-full sm:w-auto px-8"
                                >
                                    {applying ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Applying...</>
                                    ) : (
                                        'Apply Now'
                                    )}
                                </button>
                                {applyError && <p className="text-error text-sm">{applyError}</p>}
                            </div>
                        ) : isExpired ? (
                            <span className="text-text-muted text-sm">This position is no longer accepting applications.</span>
                        ) : isOwner ? (
                            <span className="text-text-muted text-sm">You posted this job.</span>
                        ) : null}
                    </div>
                </div>

                <div className="h-16" />
            </div>
        </Layout>
    );
}
