import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, Users, Zap } from 'lucide-react';
import Layout from '../components/Layout';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import api from '../api/axios';

function SkeletonCard() {
    return (
        <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full skeleton" />
                <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-28 rounded-full skeleton" />
                    <div className="h-3 w-20 rounded-full skeleton" />
                </div>
            </div>
            <div className="space-y-2 mb-4">
                <div className="h-3.5 w-full rounded-full skeleton" />
                <div className="h-3.5 w-4/5 rounded-full skeleton" />
                <div className="h-3.5 w-3/5 rounded-full skeleton" />
            </div>
            <div className="h-px bg-border mb-3" />
            <div className="flex gap-2">
                <div className="h-7 w-16 rounded-lg skeleton" />
                <div className="h-7 w-24 rounded-lg skeleton" />
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="card p-10 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-text-muted" />
            </div>
            <h3 className="text-base font-semibold text-text mb-1">The feed is empty</h3>
            <p className="text-text-muted text-sm">Be the first to post something!</p>
        </div>
    );
}

export default function Feed() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchPosts = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError('');

        try {
            const res = await api.get('posts');
            const data = Array.isArray(res.data)
                ? res.data
                : res.data?.content || res.data?.posts || res.data?.data || [];
            // Latest first
            setPosts([...data].reverse());
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load posts. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handlePostCreated = useCallback(() => {
        fetchPosts(true);
    }, [fetchPosts]);

    const handlePostDeleted = useCallback((deletedId) => {
        setPosts((prev) => prev.filter((p) => p.id !== deletedId));
    }, []);

    return (
        <Layout>
            <div className="page-container">
                {/* Page header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-text flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary fill-current" />
                            Feed
                        </h1>
                        <p className="text-text-muted text-xs mt-0.5">
                            Stay up to date with your community
                        </p>
                    </div>

                    <button
                        id="refresh-feed-btn"
                        onClick={() => fetchPosts(true)}
                        disabled={refreshing || loading}
                        className="btn-ghost gap-1.5 text-xs"
                        title="Refresh feed"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {/* Create post */}
                <CreatePost onPostCreated={handlePostCreated} />

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 pop-in">
                        <p className="text-error text-sm">{error}</p>
                        <button
                            onClick={() => fetchPosts()}
                            className="text-xs text-error/70 hover:text-error mt-1 underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Posts */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                    </div>
                ) : posts.length === 0 && !error ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onDelete={handlePostDeleted}
                            />
                        ))}
                    </div>
                )}

                {/* Bottom padding */}
                <div className="h-16" />
            </div>
        </Layout>
    );
}
