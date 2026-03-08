import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Loader2, CheckCircle2 } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

export default function CreateEvent() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '',
        description: '',
        location: '',
        eventDate: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null); // holds created event

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.eventDate) {
            setError('Please fill in all required fields.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                location: form.location.trim() || undefined,
                eventDate: new Date(form.eventDate).toISOString(),
            };
            Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

            const res = await api.post('events', payload);
            setSuccess(res.data);
            setTimeout(() => navigate(`/events/${res.data?.id || ''}`), 1800);
        } catch (err) {
            const d = err.response?.data;
            setError((typeof d === 'string' ? d : d?.message || d?.error) || 'Failed to create event.');
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
                        <h2 className="text-xl font-bold text-text mb-1">Event created!</h2>
                        <p className="text-text-secondary text-sm">{success.title}</p>
                        <p className="text-text-muted text-xs mt-1">Redirecting to event page...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // Min datetime: now (local)
    const minDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

    return (
        <Layout>
            <div className="max-w-xl mx-auto px-4 py-6">
                {/* Back */}
                <button onClick={() => navigate(-1)} className="btn-ghost mb-5 text-xs gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Events
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-text flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-primary" />
                        Create an Event
                    </h1>
                    <p className="text-text-muted text-xs mt-0.5">Bring your community together</p>
                </div>

                <div className="card p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Title */}
                        <div>
                            <label htmlFor="event-title" className="label">
                                Event Title <span className="text-error">*</span>
                            </label>
                            <input
                                id="event-title"
                                name="title"
                                type="text"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="e.g. AI Workshop, Hackathon Kickoff..."
                                className="input-field"
                                required
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label htmlFor="event-location" className="label">Location</label>
                            <input
                                id="event-location"
                                name="location"
                                type="text"
                                value={form.location}
                                onChange={handleChange}
                                placeholder="e.g. CE Auditorium, Online / Zoom"
                                className="input-field"
                            />
                        </div>

                        {/* Event Date */}
                        <div>
                            <label htmlFor="event-date" className="label">
                                Event Date & Time <span className="text-error">*</span>
                            </label>
                            <input
                                id="event-date"
                                name="eventDate"
                                type="datetime-local"
                                min={minDate}
                                value={form.eventDate}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="event-description" className="label">
                                Description <span className="text-text-muted">(optional)</span>
                            </label>
                            <textarea
                                id="event-description"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="What's this event about? Who should attend? What will happen?"
                                rows={5}
                                className="input-field resize-none"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 pop-in">
                                <p className="text-error text-sm">{error}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                            <button type="button" onClick={() => navigate('/events')} className="btn-ghost flex-1">
                                Cancel
                            </button>
                            <button
                                id="create-event-submit"
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex-1"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>Create Event <ArrowRight className="w-4 h-4" /></>
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
