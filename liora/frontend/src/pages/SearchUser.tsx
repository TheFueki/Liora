import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRef } from 'react';
import { Search, X, Shield, Loader2, UserPlus } from 'lucide-react';
import { SearchUsers } from '../../wailsjs/go/main/App';
import MiniProfile from './MiniProfile';
import '../styles/SearchUser.scss';

interface SearchUserProps {
  onClose: () => void;
  onSelectUser: (user: any) => void;
}

export default function SearchUser({ onClose, onSelectUser }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const itemRefs = useRef<any>({});

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const users = await SearchUsers(query);
          setResults(users || []);
        } finally { setLoading(false); }
      } else { setResults([]); }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

    const handleHover = (user: any) => {
    const rect = itemRefs.current[user.public_id]?.getBoundingClientRect();
    if (rect) {
      setPos({ 
        top: rect.top, 
        left: rect.right + 15 
      });
      setHoveredId(user.public_id);
    }
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
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="search-results-area">
          {results.length > 0 ? (
            results.map((user) => (
              <div 
                key={user.public_id} 
                className="search-item"
                onMouseEnter={() => setHoveredId(user.public_id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectUser(user)}
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
                      {user.is_verified && <Shield size={12} fill="#00ff88" stroke="#00ff88" className="verified-icon" />}
                    </span>
                    <span className="public-id">{user.public_id.slice(0, 24)}...</span>
                  </div>
                </div>
                <UserPlus size={18} className="add-icon" />

                {hoveredId === user.public_id && (
                  <MiniProfile user={user} />
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