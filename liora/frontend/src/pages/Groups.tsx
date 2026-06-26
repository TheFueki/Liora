import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
    Phone, Video, ChevronLeft, Users, 
    Info, Settings, Trash2, Calendar, Copy, Check, Edit2, Save, X as CloseIcon
} from 'lucide-react';
import { SendGroupMessage, GetGroupMessages } from '../../wailsjs/go/main/App';
import MessageList from '../components/chat/GroupMessageList';
import ChatInput from '../components/chat/ChatInput';
import "../styles/Groups.scss";

interface GroupData {
    id: string | number;
    name: string;
    username?: string;
    avatar_url?: string;
    description: string;
    creator_id?: string;
    created_at: string;
}

interface GroupProps {
    group: GroupData | null; 
    myID: string;
    onBack: () => void;
}

export const Group: React.FC<GroupProps> = ({ group: initialGroup, myID, onBack }) => {
    if (!initialGroup) {
        return (
            <div className="channel-loading">
                <button onClick={onBack}>Back</button>
                <p>Loading group data...</p>
            </div>
        );
    }

    const [currentGroup, setCurrentGroup] = useState<GroupData>(initialGroup);
    const isOwner = currentGroup.creator_id ? myID === currentGroup.creator_id : false;
    
    const [messages, setMessages] = useState<any[]>([]);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [memberCount, setMemberCount] = useState(1); 

    const [avatarUrlInput, setAvatarUrlInput] = useState(currentGroup.avatar_url || '');
    const [descriptionInput, setDescriptionInput] = useState(currentGroup.description || '');
    const [isEditingSettings, setIsEditingSettings] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        if (initialGroup) {
            setCurrentGroup(initialGroup);
            setAvatarUrlInput(initialGroup.avatar_url || '');
            setDescriptionInput(initialGroup.description || '');
        }
    }, [initialGroup]);

    const loadMessages = async () => {
        try {
            const history = await GetGroupMessages(currentGroup.id.toString());
            setMessages(history || []);
            setTimeout(() => scrollToBottom("auto"), 100);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchGroupDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('id, name, username, avatar_url, description, creator_id, created_at')
                .eq('id', currentGroup.id)
                .single();

            if (!error && data) {
                setCurrentGroup(data);
                setAvatarUrlInput(data.avatar_url || '');
                setDescriptionInput(data.description || '');
            }
        } catch (err) {
            console.error("Error fetching group details:", err);
        }
    };

    const fetchMemberCount = async () => {
        try {
            const { count, error } = await supabase
                .from('group_members') 
                .select('*', { count: 'exact', head: true })
                .eq('group_id', currentGroup.id);
            
            if (!error && count !== null) {
                setMemberCount(count);
            }
        } catch (e) {
            setMemberCount(1); 
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleUpdateGroupSettings = async () => {
        setIsSavingSettings(true);
        try {
            const { error } = await supabase
                .from('groups')
                .update({
                    avatar_url: avatarUrlInput.trim() || null,
                    description: descriptionInput.trim()
                })
                .eq('id', currentGroup.id);

            if (error) throw error;

            setCurrentGroup(prev => ({
                ...prev,
                avatar_url: avatarUrlInput.trim() || undefined,
                description: descriptionInput.trim()
            }));
            setIsEditingSettings(false);
        } catch (err) {
            console.error(err);
            alert("Failed to update group parameters");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleDeleteGroup = async () => {
        if (!window.confirm("Are you sure you want to delete this group? All chat history will be lost.")) return;
        
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('groups')
                .delete()
                .eq('id', currentGroup.id);

            if (error) throw error;
            setShowInfoModal(false);
            onBack(); 
        } catch (err) {
            console.error(err);
            alert("Failed to delete group");
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        loadMessages();
        fetchGroupDetails();
        fetchMemberCount();

        const groupSubscription = supabase
            .channel(`group_realtime:${currentGroup.id}`)
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'group_messages',
                    filter: `group_id=eq.${currentGroup.id}` 
                }, 
                async (payload) => {
                    const newMsg = payload.new;
                    setMessages((prev) => [...prev, newMsg]);
                    setTimeout(() => scrollToBottom(), 50);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(groupSubscription);
        };
    }, [currentGroup.id]);

    const handleSend = async (content: string) => {
        try {
            await SendGroupMessage(currentGroup.id.toString(), content); 
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="channel-container">
            <div className="channel-view animate-fade">
                <header className="channel-header">
                    <div className="header-info" onClick={() => setShowInfoModal(true)}>
                        <button className="back-btn" onClick={(e) => { e.stopPropagation(); onBack(); }}>
                            <ChevronLeft size={24} />
                        </button>
                        
                        <div className="channel-avatar-wrapper">
                            {currentGroup.avatar_url ? (
                                <img src={currentGroup.avatar_url} alt={currentGroup.name} className="channel-image" />
                            ) : (
                                <div className="channel-avatar-hash">
                                    {currentGroup.name.substring(0, 2)}
                                </div>
                            )}
                        </div>

                        <div className="user-details">
                            <div className="name-row">
                                <h3>{currentGroup.name}</h3>
                                {isOwner && <Settings size={14} className="owner-badge-icon" title="You are owner" />}
                            </div>
                            <div className="status-container">
                                <Users size={12} className="text-blue" />
                                <span className="status-text">
                                    {currentGroup.username ? `@${currentGroup.username}` : "no username"} • {memberCount} members
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
                    recipientPubKey={currentGroup.id.toString()} 
                    isChannel={false} 
                />
            </div>

            {showInfoModal && (
                <div className="channel-modal-overlay animate-fade" onClick={() => setShowInfoModal(false)}>
                    <div className="channel-modal-box animate-scale-up" onClick={(e) => e.stopPropagation()}>
                        
                        <div className="modal-header">
                            <div className="modal-title-group">
                                <div className="modal-avatar-wrapper">
                                    {currentGroup.avatar_url ? (
                                        <img src={currentGroup.avatar_url} alt={currentGroup.name} className="modal-channel-image" />
                                    ) : (
                                        <div className="modal-avatar-hash">
                                            {currentGroup.name.substring(0, 2)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h2>{currentGroup.name}</h2>
                                    <p>{currentGroup.username ? `@${currentGroup.username}` : "no username"}</p>
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
                                <div className="grid-stat-card">
                                    <Calendar size={20} />
                                    <div className="stat-value">
                                        {currentGroup.created_at ? new Date(currentGroup.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '...'}
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
                                            <label>Group Avatar URL</label>
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
                                                placeholder="Write short group description..."
                                                className="settings-textarea"
                                                rows={3}
                                            />
                                        </div>
                                        <button 
                                            className="settings-save-btn" 
                                            onClick={handleUpdateGroupSettings}
                                            disabled={isSavingSettings}
                                        >
                                            <Save size={14} />
                                            <span>{isSavingSettings ? "Saving..." : "Save parameters"}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="meta-item-box">
                                        <div className="meta-row-content">
                                            <label>Description</label>
                                            <p className="description-text">{currentGroup.description || "No description provided."}</p>
                                        </div>
                                    </div>
                                )}

                                {currentGroup.username && (
                                    <div className="meta-item-box clickable-row" onClick={() => copyToClipboard(`@${currentGroup.username}`, 'username')}>
                                        <div className="meta-row-content">
                                            <label>Group Username</label>
                                            <span className="channel-username-tag">@{currentGroup.username}</span>
                                        </div>
                                        <button className="copy-field-btn">
                                            {copiedField === 'username' ? <Check size={16} className="green-icon" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                )}

                                <div className="meta-item-box clickable-row" onClick={() => copyToClipboard(currentGroup.id.toString(), 'id')}>
                                    <div className="meta-row-content">
                                        <label>Group Unique ID</label>
                                        <code className="secure-code-text">{currentGroup.id}</code>
                                    </div>
                                    <button className="copy-field-btn">
                                        {copiedField === 'id' ? <Check size={16} className="green-icon" /> : <Copy size={16} />}
                                    </button>
                                </div>

                                <div className="meta-item-box">
                                    <div className="security-status-bar">
                                        <Users size={18} className="crypto-icon text-blue" />
                                        <div className="crypto-info-text">
                                            <h4>Public Group Chat</h4>
                                            <p>This group chat is public. Anyone using the discovery layer can join, audit history, and communicate.</p>
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
                                            onClick={handleDeleteGroup}
                                            disabled={isDeleting}
                                        >
                                            <Trash2 size={16} />
                                            {isDeleting ? "Deleting..." : "Delete Group"}
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

export default Group;