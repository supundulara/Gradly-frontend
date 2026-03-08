import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, PlusCircle, Search, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function SkeletonCard() {
    return (
        <div className="card p-5 space-y-4">
            <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded-full skeleton" />
                    <div className="h-3 w-24 rounded-full skeleton" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 w-full rounded-full skeleton" />
                <div className="h-3 w-4/5 rounded-full skeleton" />
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between">
                <div className="h-3 w-20 rounded-full skeleton" />
                <div className="h-8 w-24 rounded-xl skeleton" />
            </div>
        </div>
    );
}

export default function Events() {
    const { userId } = useAuth();
    const [events, setEvents] = useState([]);
    const [rsvpedIds, setRsvpedIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all | upcoming | past

    const fetchEvents = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError('');
        try {
            const res = await api.get('events');
            const data = Array.isArray(res.data) ? res.data
                : res.data?.content || res.data?.events || [];

            // Sort by eventDate ascending (upcoming first)
            const sorted = [...data].sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
            setEvents(sorted);

            // Determine which events the current user has RSVPed to
            // by checking each event's participants in parallel (background)
            if (userId) {
                const checks = sorted.map(async (ev) => {
                    try {
                        const pr = await api.get(`events/${ev.id}/participants`);
                        const participants = Array.isArray(pr.data) ? pr.data : [];
                        if (participants.some((p) => p.id === userId || p.id === String(userId))) {
                            return ev.id;
                        }
                    } catch { /* ignore */ }
                    return null;
                });
                const results = await Promise.all(checks);
                setRsvpedIds(new Set(results.filter(Boolean)));
            }
        } catch (err) {
            const d = err.response?.data;
            setError((typeof d === 'string' ? d : d?.message || d?.error) || 'Failed to load events.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const now = new Date();
    const filtered = events.filter((ev) => {
        const matchSearch = !search.trim() ||
            ev.title?.toLowerCase().includes(search.toLowerCase()) ||
            ev.location?.toLowerCase().includes(search.toLowerCase()) ||
            ev.creatorName?.toLowerCase().includes(search.toLowerCase());

        const matchFilter =
            filter === 'all' ? true :
                filter === 'upcoming' ? new Date(ev.eventDate) > now :
                    new Date(ev.eventDate) <= now;

        return matchSearch && matchFilter;
    });

    return (
        <Layout>
            <div className="max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-text flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-primary" />
                            Events
                        </h1>
                        <p className="text-text-muted text-xs mt-0.5">
                            {loading ? 'Loading events...' : `${events.length} event${events.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            id="refresh-events-btn"
                            onClick={() => fetchEvents(true)}
                            disabled={loading || refreshing}
                            className="btn-ghost text-xs gap-1.5"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <Link id="create-event-btn" to="/events/create" className="btn-primary text-sm">
                            <PlusCircle className="w-4 h-4" />
                            New Event
                        </Link>
                    </div>
                </div>

                {/* Search + filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        <input
                            id="event-search"
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search events..."
                            className="input-field pl-10"
                        />
                    </div>
                    <div className="flex rounded-xl border border-border overflow-hidden flex-shrink-0">
                        {[['all', 'All'], ['upcoming', 'Upcoming'], ['past', 'Past']].map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setFilter(val)}
                                className={`px-3 py-2 text-xs font-medium transition-colors ${filter === val
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-text-muted hover:text-text hover:bg-surface-hover'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 pop-in">
                        <p className="text-error text-sm">{error}</p>
                        <button onClick={() => fetchEvents()} className="text-xs text-error/70 hover:text-error mt-1 underline">
                            Try again
                        </button>
                    </div>
                )}

                {/* List */}
                {loading ? (
                    <div className="space-y-4">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
                ) : filtered.length === 0 ? (
                    <div className="card p-10 text-center animate-fade-in">
                        <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mx-auto mb-4">
                            <CalendarDays className="w-7 h-7 text-text-muted" />
                        </div>
                        <h3 className="text-base font-semibold text-text mb-1">
                            {search ? 'No events found' : 'No events yet'}
                        </h3>
                        <p className="text-text-muted text-sm mb-5">
                            {search ? `No events match "${search}".` : 'Create the first event for your community!'}
                        </p>
                        {!search && (
                            <Link to="/events/create" className="btn-primary inline-flex">
                                <PlusCircle className="w-4 h-4" />
                                Create Event
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((ev) => (
                            <EventCard
                                key={ev.id}
                                event={ev}
                                isRsvped={rsvpedIds.has(ev.id)}
                            />
                        ))}
                    </div>
                )}
                <div className="h-16" />
            </div>
        </Layout>
    );
}
