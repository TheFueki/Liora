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

  const avatar = user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.public_id}`;

  const handleMessageClick = () => {
    if (typeof onStartChat === 'function') {
      onStartChat(user); 
    }
    onClose();        
  };

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(user.public_id);
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
                {user.public_id.length > 20 
                  ? `${user.public_id.slice(0, 12)}...${user.public_id.slice(-8)}` 
                  : user.public_id}
              </code>
              <div className="copy-indicator">
                {copied ? <Check size={12} className="text-green" /> : <Copy size={12} />}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-body">
          <div className="protocol-info">
            <Info size={16} />
            <span>Node: Handshake is active</span>
          </div>
          
          <div className="bio-section">
            <label>Bio</label>
            <p>{user.bio || "No bio found."}</p>
          </div>
        </div>

        <div className="profile-actions">
          <button 
            type="button" 
            className="btn-add" 
            onClick={() => onAddContact?.(user.public_id)}
            disabled={!onAddContact}
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