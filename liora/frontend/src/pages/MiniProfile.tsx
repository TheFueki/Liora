import { Shield } from 'lucide-react';
import '../styles/MiniProfile.scss';

interface MiniProfileProps {
  user: {
    username: string;
    public_id: string;
    is_verified?: boolean;
    avatar_url?: string;
  };
}

export default function MiniProfile({ user }: MiniProfileProps) {
  const avatar = user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.public_id}`;

  return (
    <div className="mini-profile-popover animate-in">
      <div className="popover-content">
        <div className="top-row">
          <div className="mini-avatar">
            <img src={avatar} alt="node" />
          </div>
          <div className="user-meta">
            <span className="username">
              {user.username}
              {user.is_verified && <Shield size={12} fill="#00ff88" stroke="#00ff88" className="verified-icon" />}
            </span>
            <div className="id-row">
              <code>{user.public_id.slice(0, 8)}...{user.public_id.slice(-4)}</code>
            </div>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat">
            <span className="label">Trust Index</span>
            <span className="value">99.9%</span>
          </div>
          <div className="stat">
            <span className="label">Uplink</span>
            <span className="value online">Active</span>
          </div>
        </div>
      </div>
      <div className="popover-arrow"></div>
    </div>
  );
}