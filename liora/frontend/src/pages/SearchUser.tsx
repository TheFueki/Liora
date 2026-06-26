import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Shield, Loader2, UserPlus, MessageSquare, Hash, KeyRound } from 'lucide-react';
// @ts-ignore
import { SearchUsers, AddByCode } from '../../wailsjs/go/main/App';
import MiniProfile from './MiniProfile';
import '../styles/SearchUser.scss';

interface SearchResult {
  public_id: string;
  username: string;
  avatar_url?: string;
  is_verified?: boolean;
  type: 'user' | 'groups' | 'channel';
  member_count?: number;
  name?: string;
  description?: string;
  creator_id?: string;
  created_at?: string;
}

interface SearchUserProps {
  onClose: () => void;
  onViewProfile?: (item: any) => void;
}

type TabType = 'users' | 'groups' | 'channel' | 'code';

export default function SearchUser({ onClose, onViewProfile }: SearchUserProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [directCode, setDirectCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeStatus, setCodeStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
          
          if (item.type === 'channel' || item.type === 'channels') {
            resolvedType = 'channel';
          } else if (item.type === 'group' || item.type === 'groups') {
            resolvedType = 'groups';
          }

          const resolvedId = item.id || item.public_id || item.group_id || '';
          const resolvedName = item.name || item.username || 'Unnamed';

          return {
            public_id: String(resolvedId),
            username: resolvedName,
            avatar_url: item.avatar_url || '',
            is_verified: !!item.is_verified,
            type: resolvedType,
            member_count: item.member_count || 0,
            name: resolvedName,
            description: item.description || '',
            creator_id: item.creator_id || '',
            created_at: item.created_at || new Date().toISOString()
          };
        });

        setResults(validatedData);
        setExpandedId(null);
      } catch (err) {
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

  const handleConnectByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directCode.trim() || codeLoading) return;

    setCodeLoading(true);
    setCodeStatus(null);

    try {
      await AddByCode(directCode.trim());
      setCodeStatus({ type: 'success', text: 'Identity decoded. Connection established successfully!' });
      setDirectCode('');
    } catch (err: any) {
      setCodeStatus({ type: 'error', text: err?.message || 'Failed to resolve entity code.' });
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal-card" onClick={e => e.stopPropagation()}>
        
        <header className="search-header">
          <div className="input-wrapper">
            {loading ? <Loader2 size={18} className="spinner" /> : <Search size={18} />}
            <input 
              autoFocus={activeTab !== 'code'}
              type="text" 
              placeholder={activeTab === 'code' ? "Global search locked" : "Scan network for identities, channels, groups..."} 
              value={query}
              onChange={(e) => setQuery(e.target.value)} 
              disabled={activeTab === 'code'}
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
          <button 
            className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('code'); setExpandedId(null); }}
          >
            Via code
          </button>
        </div>

        <div className="search-results-area">
          {activeTab === 'code' ? (
            <div className="direct-code-panel">
              <div className="panel-icon-info">
                <KeyRound size={32} className="key-icon" />
                <h3>Connect via P2P invite vector</h3>
                <p>Enter a secure cryptographic token or direct node identity code to resolve a hidden entity immediately.</p>
              </div>

              <form onSubmit={handleConnectByCode} className="code-input-form">
                <div className="code-field-wrapper">
                  <input 
                    type="text"
                    placeholder="Enter node reference or private invitation key..."
                    value={directCode}
                    onChange={(e) => setDirectCode(e.target.value)}
                    disabled={codeLoading}
                    autoFocus
                  />
                  <button 
                    type="submit" 
                    className="submit-code-btn"
                    disabled={!directCode.trim() || codeLoading}
                  >
                    {codeLoading ? <Loader2 size={16} className="spinner" /> : 'Establish link'}
                  </button>
                </div>
              </form>

              {codeStatus && (
                <div className={`code-status-message ${codeStatus.type}`}>
                  {codeStatus.text}
                </div>
              )}
            </div>
          ) : filteredResults.length > 0 ? (
            filteredResults.map((item) => (
              <div 
                key={item.public_id} 
                className={`search-item-container ${expandedId === item.public_id ? 'expanded' : ''}`}
              >
                <div 
                  className="search-item"
                  onClick={() => { 
                    onViewProfile?.({
                      id: item.public_id,
                      name: item.name,
                      username: item.username !== item.name ? item.username : undefined,
                      avatar_url: item.avatar_url,
                      description: item.description,
                      creator_id: item.creator_id,
                      created_at: item.created_at,
                      type: item.type
                    }); 
                  }} 
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