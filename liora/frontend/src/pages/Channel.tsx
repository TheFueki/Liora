import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
    Phone, Video, MoreVertical, ShieldCheck, 
    ChevronLeft, Hash, Info, Settings, Users, Trash2 
} from 'lucide-react';
// @ts-ignore
import { SendMessage, GetMessages, DecryptMessage } from '../../wailsjs/go/main/App';
import MessageList from '../components/chat/MessageList'; 
import ChatInput from '../components/chat/ChatInput';      
import "../styles/Channel.scss";

interface ChannelData {
    id: number;
    name: string;
    description: string;
    owner_id: string;
    created_at: string;
}

interface ChannelProps {
    channel: ChannelData | null; 
    myID: string;
    onBack: () => void;
}

export const Channel: React.FC<ChannelProps> = ({ channel, myID, onBack }) => {
    if (!channel || !channel.owner_id) {
        return (
            <div className="channel-loading">
                <button onClick={onBack}>Back</button>
                <p>Loading channel data or missing owner_id...</p>
            </div>
        );
    }

    const isOwner = myID === channel.owner_id;
    const [messages, setMessages] = useState<any[]>([]);
    const [showInfo, setShowInfo] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const loadMessages = async () => {
        try {
            const history = await GetMessages(channel.id.toString());
            setMessages(history || []);
            setTimeout(() => scrollToBottom("auto"), 100);
        } catch (err) {
            console.error("Failed to load messages:", err);
        }
    };

    const handleDeleteChannel = async () => {
        if (!window.confirm("Are you sure you want to delete this channel? This action cannot be undone.")) return;
        
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('channels')
                .delete()
                .eq('id', channel.id);

            if (error) throw error;
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

        const channelSubscription = supabase
            .channel(`channel_realtime:${channel.id}`)
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'messages',
                    filter: `channel_id=eq.${channel.id}` 
                }, 
                async (payload) => {
                    const newMsg = payload.new;
                    try {
                        const clearText = await DecryptMessage(newMsg.sender_id, newMsg.content);
                        setMessages((prev) => [...prev, { ...newMsg, content: clearText }]);
                    } catch (e) {
                        setMessages((prev) => [...prev, newMsg]);
                    }
                    setTimeout(() => scrollToBottom(), 50);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channelSubscription);
        };
    }, [channel.id]);

    const handleSend = async (content: string) => {
        try {
            await SendMessage(channel.id.toString(), content); 
        } catch (err) {
            console.error("Send error:", err);
        }
    };

    return (
        <div className={`channel-container ${showInfo ? 'info-open' : ''}`}>
            <div className="channel-view chat-active-interface animate-fade">
                <header className="channel-header glass-morphism">
                    <div className="header-info">
                        <button className="back-btn" onClick={onBack}>
                            <ChevronLeft size={24} />
                        </button>
                        
                        <div className="channel-icon">
                            <Hash size={20} />
                        </div>

                        <div className="user-details">
                            <div className="name-row">
                                <h3>{channel.name}</h3>
                                {isOwner && <Settings size={14} className="owner-badge-icon" title="You are owner" />}
                            </div>
                            <div className="status-container" onClick={() => setShowInfo(!showInfo)}>
                                <ShieldCheck size={12} className="text-blue" />
                                <span className="status-text">Encrypted Channel</span>
                            </div>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button className="action-btn"><Phone size={20} /></button>
                        <button className="action-btn"><Video size={20} /></button>
                        <div className="divider-v"></div>
                        <button 
                            className={`action-btn ${showInfo ? 'active' : ''}`} 
                            onClick={() => setShowInfo(!showInfo)}
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
                    recipientPubKey={channel.id.toString()} 
                    isChannel={true} 
                />
            </div>

            {showInfo && (
                <aside className="channel-info-panel glass-morphism animate-slide-left">
                    <div className="panel-header">
                        <h2>Channel Info</h2>
                        <button className="close-panel" onClick={() => setShowInfo(false)}>×</button>
                    </div>
                    
                    <div className="panel-content">
                        <div className="info-card">
                            <div className="info-section">
                                <label>Description</label>
                                <p>{channel.description || "No description provided."}</p>
                            </div>
                            
                            <div className="info-section">
                                <label>Created</label>
                                <p>{new Date(channel.created_at).toLocaleDateString(undefined, { 
                                    year: 'numeric', month: 'long', day: 'numeric' 
                                })}</p>
                            </div>
                        </div>

                        <div className="stats-row">
                            <div className="stat-item">
                                <Users size={18} />
                                <span>Public</span>
                            </div>
                            <div className="stat-item">
                                <ShieldCheck size={18} />
                                <span>Verified</span>
                            </div>
                        </div>

                        {isOwner && (
                            <div className="admin-zone">
                                <h3>Admin Tools</h3>
                                <button 
                                    className="delete-channel-btn" 
                                    onClick={handleDeleteChannel}
                                    disabled={isDeleting}
                                >
                                    <Trash2 size={16} />
                                    {isDeleting ? "Deleting..." : "Delete Channel"}
                                </button>
                            </div>
                        )}
                    </div>
                </aside>
            )}
        </div>
    );
};

export default Channel;