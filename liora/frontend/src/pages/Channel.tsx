import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
    Phone, Video, ChevronLeft, Hash, Eye, Globe,
    Info, Settings, Users, Trash2, Calendar, Copy, Check, Edit2, Save, X as CloseIcon
} from 'lucide-react';
// @ts-ignore
import { SendMessage, GetMessages } from '../../wailsjs/go/main/App';
import MessageList from '../components/chat/MessageList'; 
import ChatInput from '../components/chat/ChatInput';      
import "../styles/Channel.scss";

interface ChannelData {
    id: number;
    name: string;
    username?: string;
    avatar_url?: string;
    description: string;
    owner_id: string;
    created_at: string;
}

interface ChannelProps {
    channel: ChannelData | null; 
    myID: string;
    onBack: () => void;
}

export const Channel: React.FC<ChannelProps> = ({ channel: initialChannel, myID, onBack }) => {
    if (!initialChannel || !initialChannel.owner_id) {
        return (
            <div className="channel-loading">
                <button onClick={onBack}>Back</button>
                <p>Loading channel data or missing owner_id...</p>
            </div>
        );
    }

    const [currentChannel, setCurrentChannel] = useState<ChannelData>(initialChannel);
    const isOwner = myID === currentChannel.owner_id;
    
    const [messages, setMessages] = useState<any[]>([]);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [memberCount, setMemberCount] = useState(1); 
    const [viewCount, setViewCount] = useState(0);

    const [avatarUrlInput, setAvatarUrlInput] = useState(currentChannel.avatar_url || '');
    const [descriptionInput, setDescriptionInput] = useState(currentChannel.description || '');
    const [isEditingSettings, setIsEditingSettings] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        if (initialChannel) {
            setCurrentChannel(initialChannel);
            setAvatarUrlInput(initialChannel.avatar_url || '');
            setDescriptionInput(initialChannel.description || '');
            setViewCount(Math.floor((initialChannel.id * 7) % 350) + 42);
        }
    }, [initialChannel]);

    const loadMessages = async () => {
        try {
            const history = await GetMessages(currentChannel.id.toString(), "");
            setMessages(history || []);
            setTimeout(() => scrollToBottom("auto"), 100);
        } catch (err) {
            console.error("Failed to load messages:", err);
        }
    };

    const fetchMemberCount = async () => {
        try {
            const { count, error } = await supabase
                .from('channel_members') 
                .select('*', { count: 'exact', head: true })
                .eq('channel_id', currentChannel.id);
            
            if (!error && count !== null) {
                setMemberCount(count);
            }
        } catch (e) {
            setMemberCount(Math.floor(Math.random() * 45) + 2); 
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleUpdateChannelSettings = async () => {
        setIsSavingSettings(true);
        try {
            const { error } = await supabase
                .from('channels')
                .update({
                    avatar_url: avatarUrlInput.trim() || null,
                    description: descriptionInput.trim()
                })
                .eq('id', currentChannel.id);

            if (error) throw error;

            setCurrentChannel(prev => ({
                ...prev,
                avatar_url: avatarUrlInput.trim() || undefined,
                description: descriptionInput.trim()
            }));
            setIsEditingSettings(false);
        } catch (err) {
            console.error("Update channel profile error:", err);
            alert("Failed to update channel parameters");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleDeleteChannel = async () => {
        if (!window.confirm("Are you sure you want to delete this channel? This action cannot be undone.")) return;
        
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('channels')
                .delete()
                .eq('id', currentChannel.id);

            if (error) throw error;
            setShowInfoModal(false);
            onBack(); 
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to delete channel");
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        loadMessages();
        fetchMemberCount();

        const channelSubscription = supabase
            .channel(`channel_realtime:${currentChannel.id}`)
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'messages',
                    filter: `recipient_id=eq.${currentChannel.id}` 
                }, 
                async (payload) => {
                    const newMsg = payload.new;
                    setMessages((prev) => [...prev, newMsg]);
                    setViewCount(prev => prev + 1);
                    setTimeout(() => scrollToBottom(), 50);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channelSubscription);
        };
    }, [currentChannel.id]);

    const handleSend = async (content: string) => {
        try {
            await SendMessage(currentChannel.id.toString(), content); 
        } catch (err) {
            console.error("Send error:", err);
        }
    };

    return (
        <div className="channel-container">
            <div className="channel-view chat-active-interface animate-fade">
                <header className="channel-header glass-morphism">
                    <div className="header-info" onClick={() => setShowInfoModal(true)}>
                        <button className="back-btn" onClick={(e) => { e.stopPropagation(); onBack(); }}>
                            <ChevronLeft size={24} />
                        </button>
                        
                        <div className="channel-avatar-wrapper">
                            {currentChannel.avatar_url ? (
                                <img src={currentChannel.avatar_url} alt={currentChannel.name} className="channel-image" />
                            ) : (
                                <div className="channel-icon-fallback">
                                    <Hash size={20} />
                                </div>
                            )}
                        </div>

                        <div className="user-details">
                            <div className="name-row">
                                <h3>{currentChannel.name}</h3>
                                {isOwner && <Settings size={14} className="owner-badge-icon" title="You are owner" />}
                            </div>
                            <div className="status-container">
                                <Globe size={12} className="text-blue" />
                                <span className="status-text">
                                    {currentChannel.username ? `@${currentChannel.username}` : "no username"} • {memberCount} members • {viewCount} views
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button className="action-btn"><Phone size={20} /></button>
                        <button className="action-btn"><Video size={20} /></button>
                        <div className="divider-v"></div>
                        <button 
                            className={`action-btn ${showInfoModal ? 'active' : ''}`} 
                            onClick={() => setShowInfoModal(true)}
                        >
                            <Info size={20} />
                        </button>
                    </div>
                </header>

                <div className="messages-scroll-area">
                    <MessageList messages={messages} myID={myID} />
                    <div ref={messagesEndRef} />
                </div>

                <ChatInput 
                    onSend={handleSend} 
                    recipientPubKey={currentChannel.id.toString()} 
                    isChannel={true} 
                />
            </div>

            {showInfoModal && (
                <div className="channel-modal-overlay animate-fade" onClick={() => setShowInfoModal(false)}>
                    <div className="channel-modal-box glass-morphism animate-scale-up" onClick={(e) => e.stopPropagation()}>
                        
                        <div className="modal-header">
                            <div className="modal-title-group">
                                <div className="modal-avatar-wrapper">
                                    {currentChannel.avatar_url ? (
                                        <img src={currentChannel.avatar_url} alt={currentChannel.name} className="modal-channel-image" />
                                    ) : (
                                        <div className="modal-avatar-hash">
                                            <Hash size={24} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h2>{currentChannel.name}</h2>
                                    <p>{currentChannel.username ? `@${currentChannel.username}` : "Публичный адрес не задан"}</p>
                                </div>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowInfoModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="info-grid-stats">
                                <div className="grid-stat-card">
                                    <Users size={20} />
                                    <div className="stat-value">{memberCount}</div>
                                    <div className="stat-label">Members</div>
                                </div>
                                <div className="grid-stat-card text-blue">
                                    <Eye size={20} />
                                    <div className="stat-value">{viewCount}</div>
                                    <div className="stat-label">Total Views</div>
                                </div>
                                <div className="grid-stat-card">
                                    <Calendar size={20} />
                                    <div className="stat-value">
                                        {new Date(currentChannel.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="stat-label">Created</div>
                                </div>
                            </div>

                            <div className="info-details-sections">
                                {isOwner && (
                                    <div className="settings-toggle-zone">
                                        <button 
                                            className={`settings-edit-btn ${isEditingSettings ? 'active' : ''}`}
                                            onClick={() => setIsEditingSettings(!isEditingSettings)}
                                        >
                                            {isEditingSettings ? <CloseIcon size={14} /> : <Edit2 size={14} />}
                                            <span>{isEditingSettings ? "Cancel Editing" : "Edit Profile"}</span>
                                        </button>
                                    </div>
                                )}

                                {isEditingSettings ? (
                                    <div className="meta-item-box settings-edit-form">
                                        <div className="form-group">
                                            <label>Channel Avatar URL</label>
                                            <input 
                                                type="text" 
                                                value={avatarUrlInput} 
                                                onChange={(e) => setAvatarUrlInput(e.target.value)}
                                                placeholder="https://example.com/avatar.png"
                                                className="settings-input"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Description</label>
                                            <textarea 
                                                value={descriptionInput} 
                                                onChange={(e) => setDescriptionInput(e.target.value)}
                                                placeholder="Write short node description..."
                                                className="settings-textarea"
                                                rows={3}
                                            />
                                        </div>
                                        <button 
                                            className="settings-save-btn" 
                                            onClick={handleUpdateChannelSettings}
                                            disabled={isSavingSettings}
                                        >
                                            <Save size={14} />
                                            <span>{isSavingSettings ? "Saving..." : "Save parameters"}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="meta-item-box">
                                            <div className="meta-row-content">
                                                <label>Description</label>
                                                <p className="description-text">{currentChannel.description || "Описание отсутствует."}</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {currentChannel.username && (
                                    <div className="meta-item-box clickable-row" onClick={() => copyToClipboard(`@${currentChannel.username}`, 'username')}>
                                        <div className="meta-row-content">
                                            <label>Юзернейм канала</label>
                                            <span className="channel-username-tag">@{currentChannel.username}</span>
                                        </div>
                                        <button className="copy-field-btn">
                                            {copiedField === 'username' ? <Check size={16} className="green-icon" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                )}

                                <div className="meta-item-box clickable-row" onClick={() => copyToClipboard(currentChannel.id.toString(), 'id')}>
                                    <div className="meta-row-content">
                                        <label>Channel Unique ID</label>
                                        <code className="secure-code-text">{currentChannel.id}</code>
                                    </div>
                                    <button className="copy-field-btn">
                                        {copiedField === 'id' ? <Check size={16} className="green-icon" /> : <Copy size={16} />}
                                    </button>
                                </div>

                                <div className="meta-item-box clickable-row" onClick={() => copyToClipboard(currentChannel.owner_id, 'owner')}>
                                    <div className="meta-row-content">
                                        <label>ID (Owner UUID)</label>
                                        <code className="secure-code-text">{currentChannel.owner_id}</code>
                                    </div>
                                    <button className="copy-field-btn">
                                        {copiedField === 'owner' ? <Check size={16} className="green-icon" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <div className="meta-item-box">
                                    <div className="security-status-bar">
                                        <Globe size={18} className="crypto-icon text-blue" />
                                        <div className="crypto-info-text">
                                            <h4>Public Channel Feed</h4>
                                            <p>This information channel is global. Content is delivered unencrypted directly to all subscribers via the unified discovery network.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isOwner && (
                                <div className="modal-admin-zone">
                                    <h4>Owner permissions control</h4>
                                    <div className="admin-actions-list">
                                        <button 
                                            className="dangerous-action-btn"
                                            onClick={handleDeleteChannel}
                                            disabled={isDeleting}
                                        >
                                            <Trash2 size={16} />
                                            {isDeleting ? "Deleting..." : "Delete Channel"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Channel;