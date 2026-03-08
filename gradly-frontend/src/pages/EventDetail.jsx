import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, MapPin, CalendarDays, Clock, User, Users,
    CheckCircle2, Loader2, UserMinus, UserPlus
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function formatEventDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatPosted(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EventDetail() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { userId } = useAuth();

    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [rsvped, setRsvped] = useState(false);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [rsvpError, setRsvpError] = useState('');

    const fetchParticipants = useCallback(async () => {
        try {
            const res = await api.get(`events/${eventId}/participants`);
            const list = Array.isArray(res.data) ? res.data : [];
            setParticipants(list);
            // Check if current user is in the list
            if (userId) {
                setRsvped(list.some((p) => p.id === userId || p.id === String(userId)));
            }
        } catch { /* ignore */ }
    }, [eventId, userId]);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`events/${eventId}`);
                setEvent(res.data);
            } catch (err) {
                const d = err.response?.data;
                setError((typeof d === 'string' ? d : d?.message || d?.error) || 'Event not found.');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
        fetchParticipants();
    }, [eventId, fetchParticipants]);

    const handleRsvp = async () => {
        if (rsvpLoading) return;
        setRsvpLoading(true);
        setRsvpError('');
        const wasRsvped = rsvped;

        // Optimistic
        setRsvped(!wasRsvped);

        try {
            if (wasRsvped) {
                await api.delete(`events/${eventId}/rsvp`);
            } else {
                await api.post(`events/${eventId}/rsvp`);
            }
            // Re-fetch participants for accurate list
            await fetchParticipants();
        } catch (err) {
            setRsvped(wasRsvped); // revert
            const d = err.response?.data;
            setRsvpError((typeof d === 'string' ? d : d?.message || d?.error) || 'RSVP failed.');
        } finally {
            setRsvpLoading(false);
        }
    };

    const isUpcoming = event?.eventDate && new Date(event.eventDate) > new Date();
    const isOrganizer = event && userId &&
        (event.createdBy === userId || event.createdBy === String(userId));

    if (loading) {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto px-4 py-10 flex justify-center">
                    <div className="loader w-6 h-6" />
                </div>
            </Layout>
        );
    }

    if (error || !event) {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto px-4 py-10 text-center">
                    <p className="text-error mb-4">{error || 'Event not found.'}</p>
                    <Link to="/events" className="btn-ghost">← Back to Events</Link>
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
                    Back to Events
                </button>

                {/* Main card */}
                <div className="card p-6 space-y-6 animate-fade-in">
                    {/* Title + status */}
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-text leading-tight">{event.title}</h1>
                            {event.creatorName && (
                                <p className="text-text-muted text-sm mt-1">Organized by <span className="text-text-secondary font-medium">{event.creatorName}</span></p>
                            )}
                        </div>
                        <div className="flex-shrink-0">
                            {isUpcoming ? (
                                <span className="badge badge-green">Upcoming</span>
                            ) : (
                                <span className="badge badge-gray">Past Event</span>
                            )}
                        </div>
                    </div>

                    {/* Meta grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {event.location && (
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <MapPin className="w-4 h-4 text-text-muted flex-shrink-0" />
                                <span>{event.location}</span>
                            </div>
                        )}
                        {event.eventDate && (
                            <div className="flex items-start gap-2 text-sm text-text-secondary">
                                <CalendarDays className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                                <span>{formatEventDate(event.eventDate)}</span>
                            </div>
                        )}
                        {event.createdAt && (
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <Clock className="w-4 h-4 text-text-muted flex-shrink-0" />
                                <span>Posted {formatPosted(event.createdAt)}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <Users className="w-4 h-4 text-text-muted flex-shrink-0" />
                            <span>{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    <div className="border-t border-border" />

                    {/* Description */}
                    {event.description && (
                        <div>
                            <h2 className="text-sm font-semibold text-text mb-3">About this event</h2>
                            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                                {event.description}
                            </p>
                        </div>
                    )}

                    {/* RSVP CTA */}
                    <div className="border-t border-border pt-4">
                        {isOrganizer ? (
                            <p className="text-text-muted text-sm flex items-center gap-2">
                                <User className="w-4 h-4" />
                                You organised this event.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                <button
                                    id={`rsvp-btn-${eventId}`}
                                    onClick={handleRsvp}
                                    disabled={rsvpLoading || !isUpcoming}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${rsvped
                                            ? 'bg-surface-elevated border border-border text-text-secondary hover:border-red-500/30 hover:text-error hover:bg-red-500/5'
                                            : 'bg-primary hover:bg-primary-dark text-black hover:shadow-glow active:scale-95'
                                        }`}
                                >
                                    {rsvpLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : rsvped ? (
                                        <><UserMinus className="w-4 h-4" /> Cancel RSVP</>
                                    ) : (
                                        <><UserPlus className="w-4 h-4" /> RSVP to this Event</>
                                    )}
                                </button>
                                {rsvped && !rsvpLoading && (
                                    <p className="text-xs text-primary flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        You're going to this event
                                    </p>
                                )}
                                {!isUpcoming && (
                                    <p className="text-xs text-text-muted">This event has already taken place.</p>
                                )}
                                {rsvpError && <p className="text-error text-sm">{rsvpError}</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Participants card */}
                <div className="card p-5 mt-4 animate-fade-in">
                    <h2 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4 text-primary" />
                        Participants
                        <span className="badge badge-gray">{participants.length}</span>
                    </h2>

                    {participants.length === 0 ? (
                        <p className="text-text-muted text-sm">No participants yet. Be the first to RSVP!</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {participants.map((p, idx) => (
                                <div
                                    key={p.id || idx}
                                    className="flex items-center gap-2 bg-surface-elevated border border-border rounded-xl px-3 py-1.5"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/40 to-surface-elevated border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                        {(p.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-xs font-medium text-text">{p.name || p.id}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="h-16" />
            </div>
        </Layout>
    );
}
