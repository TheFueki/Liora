import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Shield, Loader2, UserPlus, MessageSquare, Hash } from 'lucide-react';
// @ts-ignore
import { SearchUsers } from '../../wailsjs/go/main/App';
import MiniProfile from './MiniProfile';
import '../styles/SearchUser.scss';

interface SearchResult {
  public_id: string;
  username: string;
  avatar_url?: string;
  is_verified?: boolean;
  type: 'user' | 'groups' | 'channel';
  member_count?: number;
}

interface SearchUserProps {
  onClose: () => void;
  onViewProfile: (item: SearchResult) => void; 
}

type TabType = 'users' | 'groups' | 'channel';

export default function SearchUser({ onClose, onViewProfile }: SearchUserProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    if (query.length < 2) {
      setResults([]);
      setExpandedId(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await SearchUsers(query);
        
        if (!isCurrent) return;

        const validatedData: SearchResult[] = (data || []).map((item: any) => {
          let resolvedType: 'user' | 'groups' | 'channel' = 'user';
          if (item.type === 'channel') {
            resolvedType = 'channel';
          } else if (item.type === 'group' || item.type === 'groups') {
            resolvedType = 'groups';
          }

          return {
            public_id: item.public_id || item.id || '',
            username: item.username || item.name || 'Anonymous',
            avatar_url: item.avatar_url,
            is_verified: !!item.is_verified,
            type: resolvedType,
            member_count: item.member_count || 0
          };
        });

        setResults(validatedData);
        setExpandedId(null);
      } catch (err) {
        console.error("Error scanning network:", err);
        if (isCurrent) setResults([]);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }, 400);

    return () => {
      isCurrent = false;
      clearTimeout(delayDebounceFn);
    };
  }, [query]);

  const counts = useMemo(() => {
    let users = 0;
    let channels = 0;
    let groups = 0;

    results.forEach(item => {
      if (item.type === 'user') users++;
      else if (item.type === 'channel') channels++;
      else if (item.type === 'groups') groups++;
    });

    return { users, channels, groups };
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter(item => {
      if (activeTab === 'users') return item.type === 'user';
      if (activeTab === 'channel') return item.type === 'channel';
      if (activeTab === 'groups') return item.type === 'groups';
      return false;
    });
  }, [results, activeTab]);

  const toggleMiniProfile = (e: React.MouseEvent, publicId: string) => {
    e.stopPropagation(); 
    setExpandedId(prev => prev === publicId ? null : publicId);
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
              placeholder="Scan network for identities, channels, groups..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)} 
            />
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="search-tabs">
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('users'); setExpandedId(null); }}
          >
            Identities ({counts.users})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('groups'); setExpandedId(null); }}
          >
            Groups ({counts.groups})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'channel' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('channel'); setExpandedId(null); }}
          >
            Channels ({counts.channels})
          </button>
        </div>

        <div className="search-results-area">
          {filteredResults.length > 0 ? (
            filteredResults.map((item) => (
              <div 
                key={item.public_id} 
                className={`search-item-container ${expandedId === item.public_id ? 'expanded' : ''}`}
              >
                <div 
                  className="search-item"
                  onClick={() => onViewProfile(item)} 
                >
                  <div className="user-info">
                    <div className="avatar-small">
                      <img 
                        src={item.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${item.public_id}`} 
                        alt="avatar" 
                        className="avatar-img"
                      />
                    </div>
                    <div className="text-details">
                      <span className="username">
                        {item.type !== 'user' && (
                          item.type === 'channel' ? <Hash size={14} className="type-icon" /> : <MessageSquare size={14} className="type-icon" />
                        )}
                        {item.type === 'user' ? `@${item.username}` : item.username} 
                        {item.is_verified && (
                          <Shield size={12} fill="#00ff88" stroke="#00ff88" className="verified-icon" />
                        )}
                      </span>
                      <span className="public-id">
                        {item.type === 'user' 
                          ? (item.public_id.length > 24 ? `${item.public_id.slice(0, 24)}...` : item.public_id)
                          : `${item.member_count} participants`
                        }
                      </span>
                    </div>
                  </div>
                  
                  {item.type === 'user' && (
                    <button 
                      type="button" 
                      className={`expand-profile-btn ${expandedId === item.public_id ? 'active' : ''}`}
                      onClick={(e) => toggleMiniProfile(e, item.public_id)}
                    >
                      <UserPlus size={18} className="add-icon" />
                    </button>
                  )}
                </div>

                {expandedId === item.public_id && item.type === 'user' && (
                  <div className="inline-mini-profile-wrapper">
                    <MiniProfile user={item} />
                  </div>
                )}
              </div>
            ))
          ) : query.length >= 2 && !loading ? (
            <div className="no-results">No entities matching "{query}" in this layer.</div>
          ) : (
            <div className="search-placeholder">Enter query to decode P2P directory</div>
          )}
        </div>

      </div>
    </div>
  );
}