import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building2, CalendarDays, Clock, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function formatDate(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

function timeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function JobCard({ job, appliedJobIds = [], onApplied }) {
    const { canApplyJob, canPostJob, userId } = useAuth();
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(appliedJobIds.includes(job.id));
    const [error, setError] = useState('');

    // A user cannot apply to their own posting
    const isOwner = userId && (job.postedBy === userId || job.postedBy === String(userId));
    const showApply = canApplyJob && !isOwner;

    const handleApply = async () => {
        if (applying || applied) return;
        setApplying(true);
        setError('');
        try {
            await api.post(`jobs/${job.id}/apply`);
            setApplied(true);
            onApplied?.(job.id);
        } catch (err) {
            const data = err.response?.data;
            setError(
                (typeof data === 'string' ? data : data?.message || data?.error) ||
                'Failed to apply. Please try again.'
            );
        } finally {
            setApplying(false);
        }
    };

    const isDeadlineSoon = job.deadline &&
        (new Date(job.deadline) - Date.now()) < 7 * 24 * 60 * 60 * 1000 &&
        new Date(job.deadline) > Date.now();

    const isExpired = job.deadline && new Date(job.deadline) < Date.now();

    return (
        <article className="card card-hover p-5 flex flex-col gap-4 animate-slide-up">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                {/* Company logo placeholder */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0 text-lg font-bold text-primary">
                        {(job.company || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <Link
                            to={`/jobs/${job.id}`}
                            className="text-base font-semibold text-text hover:text-primary transition-colors line-clamp-1 leading-tight"
                        >
                            {job.title}
                        </Link>
                        <p className="text-text-secondary text-sm font-medium mt-0.5">{job.company}</p>
                    </div>
                </div>

                {/* Posted time */}
                <div className="flex-shrink-0 flex items-center gap-1 text-text-muted text-xs">
                    <Clock className="w-3 h-3" />
                    {timeAgo(job.createdAt)}
                </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {job.location && (
                    <span className="flex items-center gap-1 text-text-secondary text-xs">
                        <MapPin className="w-3 h-3 text-text-muted" />
                        {job.location}
                    </span>
                )}
                {job.deadline && (
                    <span className={`flex items-center gap-1 text-xs ${isExpired ? 'text-error' : isDeadlineSoon ? 'text-warning' : 'text-text-secondary'
                        }`}>
                        <CalendarDays className="w-3 h-3" />
                        {isExpired ? 'Expired ' : 'Deadline: '}
                        {formatDate(job.deadline)}
                    </span>
                )}
            </div>

            {/* Description */}
            {job.description && (
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                    {job.description}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border-subtle gap-2">
                {/* Posted by */}
                <span className="text-xs text-text-muted">
                    {job.postedBy ? `Posted by ${job.postedBy}` : ''}
                </span>

                <div className="flex items-center gap-2">
                    {/* View details */}
                    <Link
                        to={`/jobs/${job.id}`}
                        id={`view-job-${job.id}`}
                        className="btn-ghost text-xs px-3 py-1.5"
                    >
                        Details
                        <ArrowRight className="w-3 h-3" />
                    </Link>

                    {/* Apply button — role-gated */}
                    {showApply && !isExpired && (
                        applied ? (
                            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Applied
                            </span>
                        ) : (
                            <button
                                id={`apply-btn-${job.id}`}
                                onClick={handleApply}
                                disabled={applying || isExpired}
                                className="btn-primary text-xs px-4 py-1.5"
                            >
                                {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                            </button>
                        )
                    )}

                    {isExpired && (
                        <span className="text-xs px-3 py-1.5 rounded-xl bg-surface-elevated border border-border text-text-muted font-medium">
                            Closed
                        </span>
                    )}
                </div>
            </div>

            {/* Inline error */}
            {error && (
                <p className="text-error text-xs -mt-2 text-right">{error}</p>
            )}
        </article>
    );
}
