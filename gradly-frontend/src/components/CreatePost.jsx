import { useState, useRef } from 'react';
import { ImagePlus, Send, X, Sparkles } from 'lucide-react';
import api from '../api/axios';

export default function CreatePost({ onPostCreated }) {
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [showImageInput, setShowImageInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const textareaRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        setError('');

        try {
            const body = { content: content.trim() };
            if (imageUrl.trim()) body.imageUrl = imageUrl.trim();

            await api.post('posts', body);
            setContent('');
            setImageUrl('');
            setShowImageInput(false);
            onPostCreated?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create post.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit(e);
        }
    };

    const charCount = content.length;
    const maxChars = 500;
    const isOverLimit = charCount > maxChars;

    return (
        <div className="card p-5 mb-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="text-text-secondary text-sm font-medium">Share something with the community</span>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Text area */}
                <textarea
                    id="post-content"
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What's on your mind? Share news, achievements, or opportunities..."
                    rows={3}
                    className="w-full bg-surface-elevated/60 border border-border text-text placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-primary/40 focus:ring-1 focus:ring-primary/15 resize-none"
                />

                {/* Image URL input */}
                {showImageInput && (
                    <div className="mt-3 relative animate-slide-up">
                        <input
                            id="post-image-url"
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="input-field pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => { setShowImageInput(false); setImageUrl(''); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Image preview */}
                {imageUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border">
                        <img
                            src={imageUrl}
                            alt="Preview"
                            className="w-full max-h-48 object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <p className="text-error text-xs mt-2 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-error" />
                        {error}
                    </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            id="toggle-image-url"
                            onClick={() => setShowImageInput(!showImageInput)}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200 font-medium ${showImageInput
                                    ? 'text-primary bg-primary/10 border border-primary/20'
                                    : 'text-text-muted hover:text-text hover:bg-surface-hover'
                                }`}
                        >
                            <ImagePlus className="w-3.5 h-3.5" />
                            Image
                        </button>

                        {charCount > 0 && (
                            <span className={`text-xs ${isOverLimit ? 'text-error' : 'text-text-muted'}`}>
                                {charCount}/{maxChars}
                            </span>
                        )}
                    </div>

                    <button
                        id="submit-post-btn"
                        type="submit"
                        disabled={!content.trim() || loading || isOverLimit}
                        className="btn-primary"
                    >
                        {loading ? (
                            <span className="loader w-4 h-4" />
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5" />
                                Post
                            </>
                        )}
                    </button>
                </div>
            </form>

            <p className="text-text-muted text-xs mt-2">
                Tip: Press <kbd className="bg-surface-elevated px-1.5 py-0.5 rounded text-text-secondary font-mono text-xs">⌘</kbd>+<kbd className="bg-surface-elevated px-1.5 py-0.5 rounded text-text-secondary font-mono text-xs">Enter</kbd> to post
            </p>
        </div>
    );
}
