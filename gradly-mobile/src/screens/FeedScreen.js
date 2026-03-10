import { useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    FlatList, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography } from '../theme/colors';
import api from '../api/axios';

function timeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function PostCard({ post, onDelete }) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleLike = async () => {
        if (likeLoading) return;
        setLikeLoading(true);
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikeCount((c) => wasLiked ? Math.max(0, c - 1) : c + 1);
        try {
            if (wasLiked) await api.delete(`posts/${post.id}/likes`);
            else await api.post(`posts/${post.id}/likes`);
        } catch {
            setLiked(wasLiked);
            setLikeCount((c) => wasLiked ? c + 1 : Math.max(0, c - 1));
        } finally {
            setLikeLoading(false);
        }
    };

    const loadComments = async () => {
        setCommentsLoading(true);
        try {
            const res = await api.get(`posts/${post.id}/comments`);
            setComments(Array.isArray(res.data) ? res.data : []);
        } catch { setComments([]); } finally { setCommentsLoading(false); }
    };

    const toggleComments = () => {
        const next = !showComments;
        setShowComments(next);
        if (next) loadComments();
    };

    const submitComment = async () => {
        if (!commentText.trim()) return;
        try {
            await api.post(`posts/${post.id}/comments`, { content: commentText.trim() });
            setCommentText('');
            await loadComments();
        } catch { }
    };

    const authorDisplay = post.authorName || 'Unknown User';
    const initial = authorDisplay.charAt(0).toUpperCase();

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.postHeader}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
                <View style={styles.postMeta}>
                    <Text style={styles.authorName}>{authorDisplay}</Text>
                    <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
                </View>
                <TouchableOpacity onPress={() => onDelete && onDelete(post.id)}>
                    <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <Text style={styles.postContent}>{post.content}</Text>

            {/* Image */}
            {post.imageUrl && !imageError && (
                <Image
                    source={{ uri: post.imageUrl }}
                    style={styles.postImage}
                    onError={() => setImageError(true)}
                    resizeMode="cover"
                />
            )}

            {/* Actions */}
            <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                    <Ionicons
                        name={liked ? 'heart' : 'heart-outline'}
                        size={18}
                        color={liked ? '#ef4444' : colors.textMuted}
                    />
                    <Text style={[styles.actionText, liked && { color: '#ef4444' }]}>
                        {likeCount > 0 ? likeCount : ''} Like
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={toggleComments}>
                    <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
                    <Text style={styles.actionText}>{showComments ? 'Hide' : 'Comments'}</Text>
                </TouchableOpacity>
            </View>

            {/* Comments */}
            {showComments && (
                <View style={styles.commentsSection}>
                    {commentsLoading ? (
                        <ActivityIndicator color={colors.primary} size="small" style={{ padding: spacing.md }} />
                    ) : (
                        comments.map((c, idx) => (
                            <View key={c.id || idx} style={styles.commentItem}>
                                <View style={styles.commentAvatar}>
                                    <Text style={styles.commentAvatarText}>
                                        {(c.userName || 'U').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.commentBody}>
                                    <Text style={styles.commentAuthor}>{c.userName || 'Unknown'}</Text>
                                    <Text style={styles.commentContent}>{c.content}</Text>
                                </View>
                            </View>
                        ))
                    )}

                    {/* Comment input */}
                    <View style={styles.commentInputRow}>
                        <TextInput
                            style={styles.commentInput}
                            value={commentText}
                            onChangeText={setCommentText}
                            placeholder="Write a comment..."
                            placeholderTextColor={colors.textMuted}
                        />
                        <TouchableOpacity onPress={submitComment} style={styles.sendBtn}>
                            <Ionicons name="send" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

function CreatePostBox({ onCreated }) {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            await api.post('posts', { content: text.trim() });
            setText('');
            onCreated?.();
        } catch { } finally { setLoading(false); }
    };

    return (
        <View style={createStyles.box}>
            <TextInput
                style={createStyles.input}
                value={text}
                onChangeText={setText}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.textMuted}
                multiline
            />
            <TouchableOpacity
                style={[createStyles.btn, !text.trim() && { opacity: 0.4 }]}
                onPress={handleCreate} disabled={loading || !text.trim()}
            >
                {loading
                    ? <ActivityIndicator color="#000" size="small" />
                    : <Text style={createStyles.btnText}>Post</Text>}
            </TouchableOpacity>
        </View>
    );
}

export default function FeedScreen() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPosts = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await api.get('posts');
            const data = Array.isArray(res.data) ? res.data
                : res.data?.content || res.data?.posts || [];
            setPosts([...data].reverse());
        } catch { } finally { setLoading(false); setRefreshing(false); }
    }, []);

    useFocusEffect(useCallback(() => { fetchPosts(); }, [fetchPosts]));

    const handleDelete = async (postId) => {
        try {
            await api.delete(`posts/${postId}`);
            setPosts((p) => p.filter((x) => x.id !== postId));
        } catch { }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id || String(Math.random())}
                renderItem={({ item }) => <PostCard post={item} onDelete={handleDelete} />}
                ListHeaderComponent={<CreatePostBox onCreated={() => fetchPosts()} />}
                ListEmptyComponent={
                    loading
                        ? <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
                        : <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <Ionicons name="newspaper-outline" size={32} color={colors.textMuted} />
                            <Text style={[typography.body, { marginTop: spacing.md }]}>No posts yet</Text>
                        </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchPosts(true)}
                        tintColor={colors.primary}
                    />
                }
                contentContainerStyle={{ padding: spacing.md }}
                ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
    postHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(34,197,94,0.2)', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
    postMeta: { flex: 1 },
    authorName: { color: colors.text, fontWeight: '600', fontSize: 14 },
    postTime: { color: colors.textMuted, fontSize: 12 },
    postContent: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
    postImage: { width: '100%', height: 200, borderRadius: radius.md, marginBottom: spacing.md, backgroundColor: colors.borderSubtle },
    postActions: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.xs },
    actionText: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
    commentsSection: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: spacing.md },
    commentItem: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    commentAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center' },
    commentAvatarText: { color: colors.primary, fontWeight: '700', fontSize: 11 },
    commentBody: { flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: radius.md, padding: spacing.sm },
    commentAuthor: { color: colors.text, fontWeight: '600', fontSize: 12, marginBottom: 2 },
    commentContent: { color: colors.textSecondary, fontSize: 12 },
    commentInputRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, alignItems: 'center' },
    commentInput: {
        flex: 1, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
        borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 8,
        color: colors.text, fontSize: 13,
    },
    sendBtn: { padding: spacing.sm },
});

const createStyles = StyleSheet.create({
    box: {
        backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
        borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
    },
    input: {
        color: colors.text, fontSize: 15, minHeight: 60, textAlignVertical: 'top',
        marginBottom: spacing.sm, lineHeight: 22,
    },
    btn: {
        backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: 10,
        paddingHorizontal: spacing.xl, alignSelf: 'flex-end', alignItems: 'center',
    },
    btnText: { color: '#000', fontWeight: '700', fontSize: 14 },
});
