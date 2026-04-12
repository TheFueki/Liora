import { useState, useEffect } from 'react';
import { Search, X, UserPlus, ShieldCheck, Loader2 } from 'lucide-react';
import { SearchUsers } from '../../wailsjs/go/main/App';
import '../styles/Contacts.scss';

interface UserIdentity {
  public_id: string;
  username: string;
  avatar_url?: string;
}

interface ContactsProps {
  onClose: () => void;
}

export default function Contacts({ onClose }: ContactsProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserIdentity[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await SearchUsers(query);
        setResults((users as UserIdentity[]) || []);
      } catch (err) {
        console.error("Network scan failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div className="contacts-modal-overlay" onClick={onClose}>
      <div className="contacts-modal" onClick={e => e.stopPropagation()}>
        <div className="glow-effect"></div>
        
        <header className="modal-header">
          <div className="title-group">
            <h2>Network Identities</h2>
            <div className="status-badge">
              <span className="dot"></span>
              {results.length} users found
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="search-container">
          <div className="input-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              autoFocus
              placeholder="Enter Username or id..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {isSearching && <Loader2 size={18} className="spinner" />}
          </div>
        </div>

        <div className="users-list custom-scrollbar">
          {results.length > 0 ? (
            results.map((user, index) => (
              <div 
                key={user.public_id} 
                className="user-card" 
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="avatar-wrapper">
                  <img 
                    src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.public_id}`} 
                    alt="node-avatar" 
                  />
                  <div className="pulse-border"></div>
                </div>
                
                <div className="user-info">
                  <div className="name-row">
                    <span className="username">{user.username}</span>
                    <ShieldCheck size={14} className="verified-icon" />
                  </div>
                  <code className="public-id">{user.public_id.slice(0, 18)}...</code>
                </div>

                <button className="add-node-btn">
                  <UserPlus size={18} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="scan-line"></div>
              <p>{query.length < 2 ? "Awaiting uplink input..." : "No identities found in current sector"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}