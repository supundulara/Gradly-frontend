import { useState, useEffect, useCallback } from 'react';
import { Heart, Trash2, MoreHorizontal, Clock, User } from 'lucide-react';
import CommentSection from './CommentSection';
import api from '../api/axios';

function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PostCard({ post, onDelete }) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [likeLoading, setLikeLoading] = useState(false);
    const [likeAnimating, setLikeAnimating] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [commentCount, setCommentCount] = useState(post.commentCount || 0);
    const [imageError, setImageError] = useState(false);

    const fetchLikeCount = useCallback(async () => {
        try {
            const res = await api.get(`posts/${post.id}/likes/count`);
            // Handle various response shapes: { count: N } or plain N
            const count = typeof res.data === 'number' ? res.data : (res.data?.count ?? res.data?.likeCount ?? 0);
            setLikeCount(count);
        } catch {
            // silently ignore if endpoint not available
        }
    }, [post.id]);

    useEffect(() => {
        fetchLikeCount();
        // Init any like count from post props
        if (post.likeCount !== undefined) setLikeCount(post.likeCount);
        if (post.commentCount !== undefined) setCommentCount(post.commentCount);
    }, [post.id]);

    const handleLike = async () => {
        if (likeLoading) return;
        setLikeLoading(true);
        setLikeAnimating(true);
        setTimeout(() => setLikeAnimating(false), 400);

        const wasLiked = liked;
        // Optimistic update
        setLiked(!wasLiked);
        setLikeCount((c) => wasLiked ? Math.max(0, c - 1) : c + 1);

        try {
            if (wasLiked) {
                await api.delete(`posts/${post.id}/likes`);
            } else {
                await api.post(`posts/${post.id}/likes`);
            }
            // Re-fetch to get accurate count
            fetchLikeCount();
        } catch (err) {
            // Revert on failure
            setLiked(wasLiked);
            setLikeCount((c) => wasLiked ? c + 1 : Math.max(0, c - 1));
        } finally {
            setLikeLoading(false);
        }
    };

    const handleDelete = async () => {
        if (deleteLoading) return;
        setDeleteLoading(true);
        try {
            await api.delete(`posts/${post.id}`);
            onDelete?.(post.id);
        } catch {
            setDeleteLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    // Prefer server-provided name; fall back gracefully — never show raw IDs
    const authorDisplay = post.authorName || post.author || 'Unknown User';
    const authorInitial = authorDisplay.charAt(0).toUpperCase();

    return (
        <article className="card card-hover p-5 animate-slide-up relative group">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 via-primary/20 to-surface-elevated border border-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary text-sm">
                        {authorInitial}
                    </div>
                    {/* Author info */}
                    <div>
                        <p className="text-sm font-semibold text-text leading-tight">{authorDisplay}</p>
                        <div className="flex items-center gap-1 text-text-muted">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">{formatTime(post.createdAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Post menu */}
                <div className="relative">
                    {!showDeleteConfirm ? (
                        <button
                            id={`post-menu-${post.id}`}
                            onClick={() => setShowDeleteConfirm(true)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-red-500/5 transition-all duration-200"
                            title="Delete post"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-1.5 pop-in">
                            <span className="text-xs text-text-muted">Delete?</span>
                            <button
                                id={`confirm-delete-${post.id}`}
                                onClick={handleDelete}
                                disabled={deleteLoading}
                                className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-error border border-red-500/20 hover:bg-red-500/20 transition-all duration-150 font-medium"
                            >
                                {deleteLoading ? '...' : 'Yes'}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="text-xs px-2 py-1 rounded-lg bg-surface-elevated text-text-secondary border border-border hover:bg-surface-hover transition-all duration-150 font-medium"
                            >
                                No
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <p className="text-sm text-text leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

            {/* Image */}
            {post.imageUrl && !imageError && (
                <div className="mb-4 rounded-xl overflow-hidden border border-border bg-surface-elevated">
                    <img
                        src={post.imageUrl}
                        alt="Post media"
                        className="w-full max-h-80 object-cover hover:scale-[1.01] transition-transform duration-300"
                        onError={() => setImageError(true)}
                    />
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 pt-3 border-t border-border-subtle">
                {/* Like */}
                <button
                    id={`like-btn-${post.id}`}
                    onClick={handleLike}
                    disabled={likeLoading}
                    className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 font-medium ${liked
                        ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                        : 'text-text-muted hover:text-red-400 hover:bg-red-500/5'
                        }`}
                >
                    <Heart
                        className={`w-4 h-4 transition-all duration-200 ${liked ? 'fill-current' : ''} ${likeAnimating ? 'like-animate' : ''}`}
                    />
                    <span>{likeCount > 0 ? likeCount : ''}</span>
                </button>

                {/* Comments */}
                <CommentSection postId={post.id} initialCount={commentCount} />
            </div>
        </article>
    );
}
