import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, BriefcaseBusiness, MapPin, CalendarDays, ArrowRight, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function formatDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

function SkeletonRow() {
    return (
        <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl skeleton flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 rounded-full skeleton" />
                <div className="h-3 w-28 rounded-full skeleton" />
            </div>
            <div className="h-7 w-20 rounded-xl skeleton" />
        </div>
    );
}

export default function Applications() {
    const { canApplyJob } = useAuth();
    const [applications, setApplications] = useState([]);
    const [jobs, setJobs] = useState({});   // jobId → job object
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError('');

        try {
            const res = await api.get('jobs/applications/me');
            const apps = Array.isArray(res.data) ? res.data : [];
            setApplications(apps);

            // Fetch job details for each application (parallel)
            const jobFetches = apps.map(async (a) => {
                try {
                    const jr = await api.get(`jobs/${a.jobId}`);
                    return [a.jobId, jr.data];
                } catch {
                    return [a.jobId, null];
                }
            });

            const results = await Promise.all(jobFetches);
            const jobMap = {};
            results.forEach(([id, data]) => { if (data) jobMap[id] = data; });
            setJobs(jobMap);
        } catch (err) {
            const d = err.response?.data;
            setError((typeof d === 'string' ? d : d?.message || d?.error) || 'Failed to load applications.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // If role doesn't allow applying, show restricted
    if (!canApplyJob) {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
                    <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mx-auto mb-4">
                        <ClipboardList className="w-7 h-7 text-text-muted" />
                    </div>
                    <h2 className="text-lg font-bold text-text mb-2">Not Available</h2>
                    <p className="text-text-secondary text-sm">Admins cannot apply for jobs.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-text flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-primary" />
                            My Applications
                        </h1>
                        <p className="text-text-muted text-xs mt-0.5">
                            {loading ? 'Loading...' : `${applications.length} application${applications.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    <button
                        id="refresh-applications-btn"
                        onClick={() => fetchData(true)}
                        disabled={loading || refreshing}
                        className="btn-ghost text-xs gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 pop-in">
                        <p className="text-error text-sm">{error}</p>
                        <button onClick={() => fetchData()} className="text-xs text-error/70 hover:text-error mt-1 underline">
                            Try again
                        </button>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
                    </div>
                ) : applications.length === 0 ? (
                    <div className="card p-10 text-center animate-fade-in">
                        <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="w-7 h-7 text-text-muted" />
                        </div>
                        <h3 className="text-base font-semibold text-text mb-1">No applications yet</h3>
                        <p className="text-text-muted text-sm mb-5">
                            Start exploring opportunities and apply!
                        </p>
                        <Link to="/jobs" className="btn-primary inline-flex">
                            <BriefcaseBusiness className="w-4 h-4" />
                            Browse Jobs
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {applications.map((app, idx) => {
                            const job = jobs[app.jobId];
                            return (
                                <article
                                    key={app.jobId || idx}
                                    className="card card-hover p-4 flex items-center gap-4 animate-fade-in"
                                >
                                    {/* Company icon */}
                                    <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0 font-bold text-primary">
                                        {job ? (job.company || 'J').charAt(0).toUpperCase() : '?'}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-text leading-tight line-clamp-1">
                                            {job?.title || `Job ${app.jobId}`}
                                        </p>
                                        <p className="text-xs text-text-secondary mt-0.5">{job?.company}</p>
                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                                            {job?.location && (
                                                <span className="flex items-center gap-1 text-xs text-text-muted">
                                                    <MapPin className="w-3 h-3" />
                                                    {job.location}
                                                </span>
                                            )}
                                            {app.appliedAt && (
                                                <span className="flex items-center gap-1 text-xs text-text-muted">
                                                    <CalendarDays className="w-3 h-3" />
                                                    Applied {formatDate(app.appliedAt)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Badge + link */}
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        <span className="badge badge-green">Applied</span>
                                        <Link
                                            to={`/jobs/${app.jobId}`}
                                            id={`view-application-${app.jobId}`}
                                            className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors"
                                        >
                                            View <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                <div className="h-16" />
            </div>
        </Layout>
    );
}
