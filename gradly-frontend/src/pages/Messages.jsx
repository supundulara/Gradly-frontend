import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, MessageSquare, Search, User, Clock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat, resolveDate } from '../context/ChatContext';
import api from '../api/axios';

function formatTime(ts) {
    if (!ts) return '';
    const d = resolveDate(ts);
    if (!d || isNaN(d.getTime()) || d.getTime() === 0) return '';

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Messages() {
    const { userId } = useAuth();
    const { conversations, unreadMap, markAsRead, setConversations } = useChat();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [activeConvId, setActiveConvId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeConvDetails, setActiveConvDetails] = useState(null);
    const [sending, setSending] = useState(false);
    
    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const messagesEndRef = useRef(null);

    // Track active ID in ref for event listener
    const activeConvIdRef = useRef(activeConvId);
    useEffect(() => {
        activeConvIdRef.current = activeConvId;
    }, [activeConvId]);

    // Handle if passed via state (e.g. from clicking Message on a profile/post)
    useEffect(() => {
        if (location.state?.activeConvId) {
            setActiveConvId(location.state.activeConvId);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // When active conversation changes, fetch its messages and details
    useEffect(() => {
        if (activeConvId) {
            markAsRead(activeConvId);
            fetchConversationDetails(activeConvId);
            fetchMessages(activeConvId, true);
        } else {
            setMessages([]);
            setActiveConvDetails(null);
        }
    }, [activeConvId]);

    // Debounced search for users
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.trim().length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        const debounceTimer = setTimeout(async () => {
            setIsSearching(true);
            try {
                // Using exactly your suggested search pattern with Axios and User-Id headers
                const res = await api.get(`/users/search?query=${encodeURIComponent(searchQuery.trim())}`, {
                    headers: { 'X-User-Id': userId }
                });
                // Exclude current logged in user from results so we can't message ourselves
                setSearchResults((res.data || []).filter(u => u.id !== userId));
            } catch (err) {
                console.error('Failed to search users:', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, userId]);

    // Native custom event listener for messages hitting the global socket pool
    useEffect(() => {
        const handleNewMessage = (e) => {
            const newMsg = e.detail;
            
            // If the message belongs to the conversation we are currently viewing
            if (activeConvIdRef.current === newMsg.conversationId) {
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                // Ensure it instantly marks as read since we are viewing it
                markAsRead(newMsg.conversationId);
                setTimeout(scrollToBottomFunc, 100);
            }
        };
        
        window.addEventListener('chat_msg_received', handleNewMessage);
        return () => window.removeEventListener('chat_msg_received', handleNewMessage);
    }, [markAsRead]);

    const fetchConversationDetails = async (convId) => {
        try {
            const res = await api.get(`/conversations/${convId}`, {
                headers: { 'X-User-Id': userId }
            });
            setActiveConvDetails(res.data);
        } catch (err) {
            console.error('Failed to fetch conversation details:', err);
            const conv = conversations.find(c => c.id === convId);
            if (conv) setActiveConvDetails(conv);
        }
    };

    const fetchMessages = async (convId, scrollToBottom = false) => {
        try {
            const res = await api.get(`/conversations/${convId}/messages`, {
                headers: { 'X-User-Id': userId }
            });
            setMessages(res.data || []);
            if (scrollToBottom) {
                setTimeout(scrollToBottomFunc, 100);
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    };

    const scrollToBottomFunc = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConvId || sending) return;

        const messageContent = newMessage.trim();
        setNewMessage(''); 
        setSending(true);

        try {
            const res = await api.post(`/conversations/${activeConvId}/messages`, 
                { content: messageContent },
                { headers: { 'X-User-Id': userId } }
            );
            
            // Append optimistically
            setMessages(prev => [...prev, res.data]);
            
            // Update context locally
            setConversations(prev => {
                const updated = prev.map(c => {
                    if (c.id === activeConvId) {
                        return { ...c, lastMessage: messageContent, updatedAt: res.data.createdAt };
                    }
                    return c;
                });
                return updated.sort((a, b) => resolveDate(b.updatedAt) - resolveDate(a.updatedAt));
            });
            
            setTimeout(scrollToBottomFunc, 100);
        } catch (err) {
            console.error('Failed to send message:', err);
            setNewMessage(messageContent);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const getOtherParticipantName = (conv) => {
        if (!conv || !conv.participantIds || !conv.participantNames) return 'Unknown User';
        const otherIndex = conv.participantIds.findIndex(id => id !== userId);
        return otherIndex !== -1 ? conv.participantNames[otherIndex] : 'Unknown User';
    };

    const handleStartConversation = async (targetUserId) => {
        try {
            setSearchQuery(''); // Clear search so normal view returns
            setSearchResults([]);
            
            // This POST endpoint securely creates if not exist, or returns the existing conversation
            const res = await api.post('/conversations', {
                receiverId: targetUserId
            }, {
                headers: { 'X-User-Id': userId }
            });
            setActiveConvId(res.data.id);
        } catch (err) {
            console.error('Failed to start conversation:', err);
        }
    };

    return (
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 flex h-screen">
            <div className="flex w-full bg-surface glass rounded-2xl border border-border shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
                
                {/* Left Sidebar - Conversation List */}
                <div className={`w-full md:w-1/3 flex flex-col border-r border-border ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-text">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Messages
                        </h2>
                        <button
                            onClick={() => navigate('/feed')}
                            className="p-1.5 text-text-muted hover:text-text hover:bg-surface-hover rounded-lg transition-colors"
                            title="Back to Feed"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="p-3 border-b border-border bg-surface/30">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text placeholder-text-muted transition-all"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text rounded-full hover:bg-surface-hover"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {searchQuery.trim().length > 0 ? (
                            // Search Results View
                            <div className="py-2">
                                {isSearching ? (
                                    <div className="flex justify-center p-8">
                                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-text-muted p-8 text-center">
                                        <Search className="w-8 h-8 opacity-20 mb-3" />
                                        <p className="text-sm">No users found matching "{searchQuery}"</p>
                                    </div>
                                ) : (
                                    searchResults.map(user => (
                                        <div 
                                            key={user.id}
                                            onClick={() => handleStartConversation(user.id)}
                                            className="flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 border-b border-border-subtle hover:bg-surface-hover"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-surface-elevated border border-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-text truncate">
                                                    {user.name}
                                                </h3>
                                                <p className="text-xs text-text-muted truncate">
                                                    Start a conversation
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            // Normal Conversation List View
                            loading ? (
                                <div className="flex justify-center p-8">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-text-muted p-8 text-center gap-3">
                                    <MessageSquare className="w-10 h-10 opacity-20" />
                                    <p>No conversations yet.</p>
                                    <p className="text-sm">Use the search bar above to message someone!</p>
                                </div>
                            ) : (
                                conversations.map(conv => {
                                    const otherName = getOtherParticipantName(conv);
                                    const isActive = activeConvId === conv.id;
                                    const isUnread = unreadMap[conv.id];
                                    return (
                                        <div 
                                            key={conv.id}
                                            onClick={() => setActiveConvId(conv.id)}
                                            className={`flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 border-b border-border-subtle hover:bg-surface-hover ${isActive ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                                        >
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-surface-elevated border border-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                                                    {otherName.charAt(0).toUpperCase()}
                                                </div>
                                                {isUnread && !isActive && (
                                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary border-2 border-surface rounded-full"></span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h3 className={`text-sm tracking-tight truncate ${isActive ? 'font-bold text-text' : (isUnread ? 'font-bold text-text' : 'font-semibold text-text-secondary')}`}>
                                                        {otherName}
                                                    </h3>
                                                    <span className={`text-[10px] flex-shrink-0 whitespace-nowrap ml-2 ${isUnread && !isActive ? 'text-primary font-bold' : 'text-text-muted'}`}>
                                                        {formatTime(conv.updatedAt)}
                                                    </span>
                                                </div>
                                                <p className={`text-xs truncate ${isActive ? 'text-text-secondary' : (isUnread ? 'text-text font-medium' : 'text-text-muted')}`}>
                                                    {conv.lastMessage || 'Started a conversation'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )
                        )}
                    </div>
                </div>

                {/* Right Panel - Chat Window */}
                <div className={`w-full md:w-2/3 flex flex-col bg-surface-elevated/30 relative ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
                    {activeConvId ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-border bg-surface/80 backdrop-blur-md flex items-center justify-between shadow-sm z-10 hidden-scrollbar">
                                <div className="flex items-center gap-3">
                                    <button 
                                        className="md:hidden p-2 -ml-2 text-text-muted hover:text-text rounded-lg hover:bg-surface-hover transition-colors"
                                        onClick={() => setActiveConvId(null)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                    </button>
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-surface-elevated border border-primary/20 flex items-center justify-center font-bold text-primary">
                                        {getOtherParticipantName(activeConvDetails).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-text">{getOtherParticipantName(activeConvDetails)}</h3>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveConvId(null)}
                                    className="hidden md:flex p-2 text-text-muted hover:text-text rounded-lg hover:bg-surface-hover transition-colors"
                                    title="Close conversation"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Message List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg, index) => {
                                    const isMine = msg.senderId === userId;
                                    const showAvatar = index === messages.length - 1 || messages[index + 1]?.senderId !== msg.senderId;
                                    
                                    return (
                                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group max-w-full`}>
                                            <div className={`flex max-w-[75%] ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                                                
                                                {/* Spacer or Avatar */}
                                                {!isMine && (
                                                    <div className="w-6 h-6 flex-shrink-0">
                                                        {showAvatar && (
                                                            <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] font-bold text-text-secondary">
                                                                {msg.senderName?.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                                    <div 
                                                        className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed relative ${
                                                            isMine 
                                                            ? 'bg-primary text-black rounded-br-sm shadow-md shadow-primary/20' 
                                                            : 'bg-surface border border-border text-text rounded-bl-sm shadow-sm'
                                                        }`}
                                                    >
                                                        {msg.content}
                                                    </div>
                                                    <span className={`text-[10px] mt-1 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isMine ? 'mr-1' : 'ml-1'}`}>
                                                        {formatTime(msg.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-surface/80 backdrop-blur-md border-t border-border">
                                <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a message..."
                                        className="w-full bg-surface-elevated border border-border text-sm rounded-xl px-4 py-3 min-h-[48px] max-h-[120px] focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 resize-none transition-all scrollbar-hide text-text"
                                        rows={Math.min(Math.max(newMessage.split('\n').length, 1), 4)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || sending}
                                        className="h-[48px] w-[48px] flex-shrink-0 flex items-center justify-center rounded-xl bg-primary text-black hover:bg-primary/90 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                                    >
                                        <Send className="w-5 h-5 -ml-0.5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-8 text-center gap-4 bg-gradient-to-b from-transparent to-surface/30">
                            <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center shadow-lg">
                                <MessageSquare className="w-10 h-10 text-primary/50" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-text mb-2">Your Messages</h3>
                                <p className="text-sm max-w-sm">Select a conversation from the sidebar or start a new one to begin messaging.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

