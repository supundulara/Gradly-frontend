import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, PlusCircle, Search, Filter, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import JobCard from '../components/JobCard';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function SkeletonCard() {
    return (
        <div className="card p-5 space-y-4">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded-full skeleton" />
                    <div className="h-3 w-32 rounded-full skeleton" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 w-full rounded-full skeleton" />
                <div className="h-3 w-5/6 rounded-full skeleton" />
                <div className="h-3 w-4/6 rounded-full skeleton" />
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between">
                <div className="h-3 w-24 rounded-full skeleton" />
                <div className="h-8 w-20 rounded-xl skeleton" />
            </div>
        </div>
    );
}

export default function Jobs() {
    const { canPostJob, canApplyJob } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [appliedIds, setAppliedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const fetchAppliedIds = useCallback(async () => {
        if (!canApplyJob) return;
        try {
            const res = await api.get('jobs/applications/me');
            const data = Array.isArray(res.data) ? res.data : [];
            setAppliedIds(data.map((a) => a.jobId));
        } catch {
            // Not critical — just won't show "Applied" badges
        }
    }, [canApplyJob]);

    const fetchJobs = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError('');
        try {
            const res = await api.get('jobs');
            const data = Array.isArray(res.data) ? res.data
                : res.data?.content || res.data?.jobs || res.data?.data || [];
            setJobs([...data].reverse());
        } catch (err) {
            const d = err.response?.data;
            setError((typeof d === 'string' ? d : d?.message || d?.error) || 'Failed to load jobs.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
        fetchAppliedIds();
    }, [fetchJobs, fetchAppliedIds]);

    const handleApplied = (jobId) => {
        setAppliedIds((prev) => [...prev, jobId]);
    };

    const filtered = jobs.filter((j) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            j.title?.toLowerCase().includes(q) ||
            j.company?.toLowerCase().includes(q) ||
            j.location?.toLowerCase().includes(q) ||
            j.description?.toLowerCase().includes(q)
        );
    });

    return (
        <Layout>
            <div className="max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-text flex items-center gap-2">
                            <BriefcaseBusiness className="w-5 h-5 text-primary" />
                            Jobs & Internships
                        </h1>
                        <p className="text-text-muted text-xs mt-0.5">
                            {loading ? 'Loading opportunities...' : `${jobs.length} opportunit${jobs.length === 1 ? 'y' : 'ies'} available`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            id="refresh-jobs-btn"
                            onClick={() => fetchJobs(true)}
                            disabled={loading || refreshing}
                            className="btn-ghost text-xs gap-1.5"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>

                        {canPostJob && (
                            <Link id="post-job-btn" to="/jobs/create" className="btn-primary text-sm">
                                <PlusCircle className="w-4 h-4" />
                                Post Job
                            </Link>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    <input
                        id="job-search"
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by title, company, or location..."
                        className="input-field pl-10"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 pop-in">
                        <p className="text-error text-sm">{error}</p>
                        <button onClick={() => fetchJobs()} className="text-xs text-error/70 hover:text-error mt-1 underline">
                            Try again
                        </button>
                    </div>
                )}

                {/* List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="card p-10 text-center animate-fade-in">
                        <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mx-auto mb-4">
                            <BriefcaseBusiness className="w-7 h-7 text-text-muted" />
                        </div>
                        <h3 className="text-base font-semibold text-text mb-1">
                            {search ? 'No results found' : 'No opportunities yet'}
                        </h3>
                        <p className="text-text-muted text-sm">
                            {search
                                ? `No jobs match "${search}". Try a different search.`
                                : canPostJob
                                    ? 'Be the first to post an opportunity!'
                                    : 'Check back soon for new opportunities.'}
                        </p>
                        {canPostJob && !search && (
                            <Link to="/jobs/create" className="btn-primary mt-4 inline-flex">
                                <PlusCircle className="w-4 h-4" />
                                Post first job
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                appliedJobIds={appliedIds}
                                onApplied={handleApplied}
                            />
                        ))}
                    </div>
                )}

                <div className="h-16" />
            </div>
        </Layout>
    );
}
