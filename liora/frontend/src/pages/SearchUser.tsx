import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Shield, Loader2, UserPlus } from 'lucide-react';
import { SearchUsers } from '../../wailsjs/go/main/App';
import MiniProfile from './MiniProfile';
import '../styles/SearchUser.scss';

interface SearchUserProps {
  onClose: () => void;
  onViewProfile: (user: any) => void; 
}

export default function SearchUser({ onClose, onViewProfile }: SearchUserProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const users = await SearchUsers(query); 
          setResults(users || []);
        } catch (err) {
          console.error("Error searching users:", err);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const toggleMiniProfile = (e: React.MouseEvent, publicId: string) => {
    e.stopPropagation(); 
    setExpandedUserId(prev => prev === publicId ? null : publicId);
  };

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal-card" onClick={e => e.stopPropagation()}>
        <header className="search-header">
          <div className="input-wrapper">
            {loading ? <Loader2 size={18} className="spinner" /> : <Search size={18} />}
            <input 
              autoFocus
              type="text" 
              placeholder="Search by username or Public ID..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)} 
            />
          </div>
          <button type="button" className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="search-results-area">
          {results.length > 0 ? (
            results.map((user) => (
              <div 
                key={user.public_id} 
                className={`search-item-container ${expandedUserId === user.public_id ? 'expanded' : ''}`}
              >
                <div 
                  className="search-item"
                  onClick={() => onViewProfile(user)} 
                >
                  <div className="user-info">
                    <div className="avatar-small">
                      <img 
                        src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.public_id}`} 
                        alt="avatar" 
                        className="avatar-img"
                      />
                    </div>
                    <div className="text-details">
                      <span className="username">
                        {user.username} 
                        {user.is_verified && (
                          <Shield size={12} fill="#00ff88" stroke="#00ff88" className="verified-icon" />
                        )}
                      </span>
                      <span className="public-id">
                        {user.public_id.length > 24 ? `${user.public_id.slice(0, 24)}...` : user.public_id}
                      </span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className={`expand-profile-btn ${expandedUserId === user.public_id ? 'active' : ''}`}
                    onClick={(e) => toggleMiniProfile(e, user.public_id)}
                  >
                    <UserPlus size={18} className="add-icon" />
                  </button>
                </div>

                {expandedUserId === user.public_id && (
                  <div className="inline-mini-profile-wrapper">
                    <MiniProfile user={user} />
                  </div>
                )}
              </div>
            ))
          ) : query.length >= 2 && !loading ? (
            <div className="no-results">No identities found for "{query}"</div>
          ) : (
            <div className="search-placeholder">Type at least 2 characters to scan the network</div>
          )}
        </div>
      </div>
    </div>
  );
}