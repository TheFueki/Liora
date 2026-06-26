import React, { useState } from 'react';
import { Shield, UserPlus, MessageSquare, X, Info, Fingerprint, Check, Copy } from 'lucide-react';
import '../styles/OtherProfile.scss';

interface OtherProfileProps {
  user: any;
  onClose: () => void;
  onAddContact?: (id: string) => void;
  onStartChat: (user: any) => void; 
}

export default function OtherProfile({ user, onClose, onAddContact, onStartChat }: OtherProfileProps) {
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const userId = user.public_id || user.id || '';
  const avatar = user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`;

  const handleMessageClick = () => {
    if (typeof onStartChat === 'function') {
      onStartChat(user); 
    }
    onClose();        
  };

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="other-profile-card glass-morphism" onClick={e => e.stopPropagation()}>
        <div className="card-glow"></div>
        <button type="button" className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="profile-header">
          <div className="avatar-section">
            <div className="avatar-main">
              <img src={avatar} alt="identity" />
            </div>
            {user.is_verified && (
              <div className="verified-badge" title="Identity Confirmed">
                <Shield size={16} fill="#00ff88" stroke="#07070a" />
              </div>
            )}
          </div>
          
          <div className="header-text">
            <h2>@{user.username || "Anonymous"}</h2>
            <div className="id-badge" onClick={handleCopyId} title="Click to copy Public ID">
              <Fingerprint size={14} className="fingerprint-icon" />
              <code>
                {userId.length > 20 
                  ? `${userId.slice(0, 12)}...${userId.slice(-8)}` 
                  : userId || "Unknown ID"}
              </code>
              <div className="copy-indicator">
                {copied ? <Check size={12} className="text-green" /> : <Copy size={12} />}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-body">
          
          <div className="bio-section">
            <label>Bio</label>
            <p>{user.bio || user.description || "No bio found."}</p>
          </div>
        </div>

        <div className="profile-actions">
          <button 
            type="button" 
            className="btn-add" 
            onClick={() => onAddContact?.(userId)}
            disabled={!onAddContact || !userId}
          >
            <UserPlus size={18} /> 
            <span>Add Contact</span>
          </button>
          
          <button 
            type="button" 
            className="btn-msg" 
            onClick={handleMessageClick}
          >
            <MessageSquare size={18} /> 
            <span>Message</span>
          </button>
        </div>
      </div>
    </div>
  );
}