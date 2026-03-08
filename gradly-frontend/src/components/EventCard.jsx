import { MapPin, CalendarDays, Clock, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function formatEventDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    }) + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function isUpcoming(ts) {
    return ts && new Date(ts) > new Date();
}

export default function EventCard({ event, isRsvped = false }) {
    const upcoming = isUpcoming(event.eventDate);

    return (
        <article className="card card-hover p-5 flex flex-col gap-4 animate-slide-up">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Date box */}
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-base leading-none">
                            {new Date(event.eventDate).getDate()}
                        </span>
                        <span className="text-primary/70 text-xs font-medium uppercase">
                            {new Date(event.eventDate).toLocaleString('en-US', { month: 'short' })}
                        </span>
                    </div>

                    <div className="min-w-0">
                        <Link
                            to={`/events/${event.id}`}
                            className="text-base font-semibold text-text hover:text-primary transition-colors line-clamp-1 leading-tight"
                        >
                            {event.title}
                        </Link>
                        {event.creatorName && (
                            <p className="text-xs text-text-muted mt-0.5">by {event.creatorName}</p>
                        )}
                    </div>
                </div>

                {/* Status badges */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {upcoming ? (
                        <span className="badge badge-green">Upcoming</span>
                    ) : (
                        <span className="badge badge-gray">Past</span>
                    )}
                    {isRsvped && (
                        <span className="flex items-center gap-1 text-xs text-primary">
                            <CheckCircle2 className="w-3 h-3" />
                            Going
                        </span>
                    )}
                </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {event.location && (
                    <span className="flex items-center gap-1 text-xs text-text-secondary">
                        <MapPin className="w-3 h-3 text-text-muted" />
                        {event.location}
                    </span>
                )}
                {event.eventDate && (
                    <span className="flex items-center gap-1 text-xs text-text-secondary">
                        <CalendarDays className="w-3 h-3 text-text-muted" />
                        {formatEventDate(event.eventDate)}
                    </span>
                )}
            </div>

            {/* Description snippet */}
            {event.description && (
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                    {event.description}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(event.createdAt)}
                </span>
                <Link
                    to={`/events/${event.id}`}
                    id={`view-event-${event.id}`}
                    className="btn-ghost text-xs px-3 py-1.5"
                >
                    View Details
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </article>
    );
}
