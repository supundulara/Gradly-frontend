import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Clock, ArrowRight, X } from 'lucide-react';
import api from '../api/axios';

function timeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function buildMessage(n) {
    const actor = n.actorName || n.creatorName || 'Someone';
    const msg = n.message || '';
    const title = n.eventTitle;
    if (title) return `${actor} ${msg}: ${title}`;
    return `${actor} ${msg}`;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('notifications');
            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch {
            // silent — bell shouldn't break the nav
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch + polling every 30s
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        function handleClick(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;
    const recent = notifications.slice(0, 6);

    return (
        <div ref={dropdownRef} className="relative">
            {/* Bell button */}
            <button
                id="notification-bell"
                onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
                className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${open ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text hover:bg-surface-hover'
                    }`}
                title="Notifications"
            >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-black text-[10px] font-bold flex items-center justify-center leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-10 w-80 bg-surface border border-border rounded-2xl shadow-card-hover overflow-hidden z-50 animate-slide-up">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Bell className="w-3.5 h-3.5 text-primary" />
                            <span className="text-sm font-semibold text-text">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="badge badge-green">{unreadCount} new</span>
                            )}
                        </div>
                        <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text transition-colors">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="flex justify-center py-6">
                                <div className="loader" />
                            </div>
                        ) : recent.length === 0 ? (
                            <div className="py-8 text-center">
                                <CheckCheck className="w-6 h-6 text-text-muted mx-auto mb-2" />
                                <p className="text-text-muted text-sm">You're all caught up!</p>
                            </div>
                        ) : (
                            recent.map((n, idx) => (
                                <div
                                    key={n.id || idx}
                                    className={`px-4 py-3 border-b border-border-subtle last:border-0 flex items-start gap-3 transition-colors hover:bg-surface-hover ${!n.read ? 'bg-primary/5' : ''
                                        }`}
                                >
                                    {/* Unread dot */}
                                    <div className="flex-shrink-0 mt-1">
                                        {!n.read ? (
                                            <span className="w-2 h-2 rounded-full bg-primary block" />
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-border block" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-text leading-relaxed">{buildMessage(n)}</p>
                                        <span className="text-xs text-text-muted flex items-center gap-1 mt-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            {timeAgo(n.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-border">
                        <Link
                            to="/notifications"
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary-light font-medium transition-colors"
                        >
                            View all notifications
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
