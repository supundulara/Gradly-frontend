import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Clock, RefreshCw, Circle } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

function timeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Build a readable sentence from the notification payload
function buildMessage(n) {
    const actor = n.actorName || n.creatorName || 'Someone';
    const msg = n.message || '';
    const title = n.eventTitle;
    if (title) return { actor, rest: `${msg}: `, highlight: title };
    return { actor, rest: msg, highlight: null };
}

// Pick an icon/color based on message content
function notifStyle(n) {
    const m = (n.message || '').toLowerCase();
    if (m.includes('liked') || m.includes('like')) return { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' };
    if (m.includes('comment')) return { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' };
    if (m.includes('attending') || m.includes('rsvp')) return { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' };
    if (m.includes('cancel')) return { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' };
    if (m.includes('event') || m.includes('created')) return { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' };
    return { bg: 'bg-surface-elevated', text: 'text-text-muted', dot: 'bg-border' };
}

function SkeletonRow() {
    return (
        <div className="flex items-start gap-3 p-4 border-b border-border-subtle">
            <div className="w-2 h-2 rounded-full skeleton mt-1.5 flex-shrink-0" />
            <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3.5 w-64 rounded-full skeleton" />
                <div className="h-3 w-20 rounded-full skeleton" />
            </div>
        </div>
    );
}

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchNotifications = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError('');
        try {
            const res = await api.get('notifications');
            const data = Array.isArray(res.data) ? res.data : [];
            // Latest first
            setNotifications([...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            const d = err.response?.data;
            setError((typeof d === 'string' ? d : d?.message || d?.error) || 'Failed to load notifications.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <Layout>
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-text flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary" />
                            Notifications
                        </h1>
                        <p className="text-text-muted text-xs mt-0.5">
                            {loading ? 'Loading...' : (
                                unreadCount > 0
                                    ? `${unreadCount} unread · ${notifications.length} total`
                                    : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`
                            )}
                        </p>
                    </div>

                    <button
                        id="refresh-notifications-btn"
                        onClick={() => fetchNotifications(true)}
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
                        <button onClick={() => fetchNotifications()} className="text-xs text-error/70 hover:text-error mt-1 underline">
                            Try again
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="card overflow-hidden">
                    {loading ? (
                        <div>{[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}</div>
                    ) : notifications.length === 0 ? (
                        <div className="py-16 text-center animate-fade-in">
                            <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mx-auto mb-4">
                                <CheckCheck className="w-7 h-7 text-text-muted" />
                            </div>
                            <h3 className="text-base font-semibold text-text mb-1">All caught up!</h3>
                            <p className="text-text-muted text-sm">No notifications yet.</p>
                        </div>
                    ) : (
                        <div>
                            {/* Unread section */}
                            {unreadCount > 0 && (
                                <>
                                    <div className="px-4 py-2 bg-primary/5 border-b border-border">
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">New</p>
                                    </div>
                                    {notifications.filter((n) => !n.read).map((n, idx) => (
                                        <NotifRow key={n.id || idx} n={n} />
                                    ))}
                                    {notifications.some((n) => n.read) && (
                                        <div className="px-4 py-2 bg-surface-elevated border-b border-border">
                                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Earlier</p>
                                        </div>
                                    )}
                                </>
                            )}
                            {/* Read section */}
                            {notifications.filter((n) => n.read).map((n, idx) => (
                                <NotifRow key={n.id || `r-${idx}`} n={n} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="h-16" />
            </div>
        </Layout>
    );
}

function NotifRow({ n }) {
    const style = notifStyle(n);
    const { actor, rest, highlight } = buildMessage(n);

    return (
        <div
            className={`flex items-start gap-3 px-4 py-4 border-b border-border-subtle last:border-0 transition-colors hover:bg-surface-hover ${!n.read ? 'bg-primary/[0.03]' : ''
                }`}
        >
            {/* Unread indicator */}
            <div className="flex-shrink-0 mt-1.5">
                <span className={`w-2 h-2 rounded-full block ${!n.read ? style.dot : 'bg-transparent'}`} />
            </div>

            {/* Avatar */}
            <div className={`w-9 h-9 rounded-full ${style.bg} border border-border flex items-center justify-center flex-shrink-0 font-bold text-sm ${style.text}`}>
                {(n.actorName || n.creatorName || '?').charAt(0).toUpperCase()}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-text leading-relaxed">
                    <span className="font-semibold">{actor}</span>{' '}
                    <span className="text-text-secondary">{rest}</span>
                    {highlight && <span className="text-primary font-medium">{highlight}</span>}
                </p>
                <span className="text-xs text-text-muted flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(n.createdAt)}
                </span>
            </div>

            {/* Badge */}
            {!n.read && (
                <span className="flex-shrink-0 badge badge-green text-[10px] px-1.5 py-0.5">New</span>
            )}
        </div>
    );
}
