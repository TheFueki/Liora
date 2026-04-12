import { Shield, UserPlus, MessageSquare, X, Info, Fingerprint } from 'lucide-react';
import '../styles/OtherProfile.scss';

interface OtherProfileProps {
  user: any;
  onClose: () => void;
  onAddContact?: (id: string) => void;
}

export default function OtherProfile({ user, onClose, onAddContact }: OtherProfileProps) {
  if (!user) return null;

  const avatar = user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.public_id}`;

  return (
    <div className="modal-overlay animate-fade" onClick={onClose}>
      <div className="other-profile-card glass-morphism" onClick={e => e.stopPropagation()}>
        <div className="card-glow"></div>
        <button className="close-btn" onClick={onClose}><X size={20} /></button>
        
        <div className="profile-header">
          <div className="avatar-section">
            <div className="avatar-main">
              <img src={avatar} alt="identity" />
            </div>
            {user.is_verified && (
              <div className="verified-badge" title="Identity Confirmed">
                <Shield size={18} fill="#00ff88" stroke="#000" />
              </div>
            )}
          </div>
          
          <div className="header-text">
            <h2>{user.username}</h2>
            <div className="id-badge">
              <Fingerprint size={14} />
              <code>{user.public_id}</code>
            </div>
          </div>
        </div>

        <div className="profile-body">
          <div className="protocol-info">
            <Info size={16} />
            <span>Secure Node: P2P Ed25519 Handshake active</span>
          </div>
          
          <div className="bio-section">
            <label>Transmission / Bio</label>
            <p>{user.bio || "No encrypted bio found for this identity node."}</p>
          </div>
        </div>

        <div className="profile-actions">
          <button className="btn-add" onClick={() => onAddContact?.(user.public_id)}>
            <UserPlus size={18} /> Add to Network
          </button>
          <button className="btn-msg">
            <MessageSquare size={18} /> Start Session
          </button>
        </div>
      </div>
    </div>
  );
}