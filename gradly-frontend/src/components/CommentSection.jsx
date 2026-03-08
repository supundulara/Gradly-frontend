import { useState, useEffect } from 'react';
import { MessageCircle, Send, User, Loader2 } from 'lucide-react';
import api from '../api/axios';

export default function CommentSection({ postId, initialCount = 0 }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');

    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await api.get(`posts/${postId}/comments`);
            setComments(Array.isArray(res.data) ? res.data : []);
        } catch {
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) fetchComments();
    }, [open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        setError('');
        try {
            await api.post(`posts/${postId}/comments`, { content: newComment.trim() });
            setNewComment('');
            await fetchComments();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add comment.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        const now = new Date();
        const diff = Math.floor((now - d) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="mt-1">
            {/* Toggle button */}
            <button
                id={`toggle-comments-${postId}`}
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 font-medium ${open
                    ? 'text-primary bg-primary/10'
                    : 'text-text-muted hover:text-text hover:bg-surface-hover'
                    }`}
            >
                <MessageCircle className="w-4 h-4" />
                <span>{initialCount > 0 ? initialCount : ''} {open ? 'Hide' : 'Comments'}</span>
            </button>

            {/* Comment panel */}
            {open && (
                <div className="mt-3 space-y-3 animate-slide-up">
                    {/* Comment input */}
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-text-muted" />
                        </div>
                        <div className="flex-1 relative">
                            <input
                                id={`comment-input-${postId}`}
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="input-field pr-10 py-2 text-xs"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || submitting}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary disabled:opacity-30 transition-colors"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <p className="text-error text-xs pl-9">{error}</p>
                    )}

                    {/* Comments list */}
                    {loading ? (
                        <div className="flex justify-center py-4">
                            <div className="loader" />
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-text-muted text-xs text-center py-4 pl-9">
                            No comments yet. Be the first!
                        </p>
                    ) : (
                        <div className="space-y-2.5">
                            {comments.map((c, idx) => (
                                <div key={c.id || idx} className="flex gap-2 animate-fade-in">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-surface-elevated border border-border flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                                        {(c.userName || c.authorName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 bg-surface-elevated rounded-xl px-3 py-2 border border-border-subtle">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-xs font-semibold text-text">
                                                {c.userName || c.authorName || 'Unknown User'}
                                            </span>
                                            <span className="text-xs text-text-muted">{formatTime(c.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-text-secondary leading-relaxed">{c.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
