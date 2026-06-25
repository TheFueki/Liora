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
}

interface SearchUserProps {
  onClose: () => void;
  onViewProfile: (item: SearchResult) => void; 
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
    console.log("[SearchUser] Component mounted or parameters changed.");
    return () => console.log("[SearchUser] Component unmounted.");
  }, []);

  useEffect(() => {
    let isCurrent = true;

    console.log(`[SearchUser] Query changed: "${query}" (length: ${query.length})`);

    if (query.length < 2) {
      console.log("[SearchUser] Query too short (< 2 chars). Resetting results.");
      setResults([]);
      setExpandedId(null);
      return;
    }

    console.log("[SearchUser] Setting up debounce timer for 400ms...");
    const delayDebounceFn = setTimeout(async () => {
      console.log(`[SearchUser] Debounce triggered for query: "${query}"`);
      setLoading(true);
      try {
        console.log("[SearchUser] Invoking backend SearchUsers()...");
        const data = await SearchUsers(query);
        console.log("[SearchUser] Raw backend response received:", data);
        
        if (!isCurrent) {
          console.warn("[SearchUser] Race condition prevented: component state or query changed before response finalized.");
          return;
        }

        const validatedData: SearchResult[] = (data || []).map((item: any, index: number) => {
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

        console.log("[SearchUser] Map & Validation complete. Transformed items:", validatedData);
        setResults(validatedData);
        setExpandedId(null);
      } catch (err) {
        console.error("[SearchUser] Critical error scanning network via SearchUsers:", err);
        if (isCurrent) setResults([]);
      } finally {
        if (isCurrent) {
          console.log("[SearchUser] Loading execution finished.");
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      console.log(`[SearchUser] Cleanup: clearing debounce for query "${query}"`);
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

    console.log("[SearchUser] Recalculated tabs metrics:", { users, channels, groups });
    return { users, channels, groups };
  }, [results]);

  const filteredResults = useMemo(() => {
    const filtered = results.filter(item => {
      if (activeTab === 'users') return item.type === 'user';
      if (activeTab === 'channel') return item.type === 'channel';
      if (activeTab === 'groups') return item.type === 'groups';
      return false;
    });
    console.log(`[SearchUser] Tab filtering executed [Target: ${activeTab}]. Matches found:`, filtered.length);
    return filtered;
  }, [results, activeTab]);

  const toggleMiniProfile = (e: React.MouseEvent, publicId: string) => {
    e.stopPropagation(); 
    console.log(`[SearchUser] Toggling mini profile drawer for ID: ${publicId}`);
    setExpandedId(prev => prev === publicId ? null : publicId);
  };

  const handleConnectByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[SearchUser] Code form submission requested. Core reference: "${directCode}"`);
    
    if (!directCode.trim()) {
      console.warn("[SearchUser] AddByCode aborted: empty raw token input.");
      return;
    }
    if (codeLoading) {
      console.warn("[SearchUser] AddByCode aborted: operation already in progress.");
      return;
    }

    setCodeLoading(true);
    setCodeStatus(null);

    try {
      const targetToken = directCode.trim();
      console.log(`[SearchUser] Invoking backend AddByCode() with token: "${targetToken}"`);
      await AddByCode(targetToken);
      console.log("[SearchUser] Backend successfully resolved and connected node via invitation mapping.");
      setCodeStatus({ type: 'success', text: 'Identity decoded. Connection established successfully!' });
      setDirectCode('');
    } catch (err: any) {
      console.error("[SearchUser] Backend execution failed inside AddByCode wrapper:", err);
      setCodeStatus({ type: 'error', text: err?.message || 'Failed to resolve entity code.' });
    } finally {
      console.log("[SearchUser] AddByCode thread execution finished.");
      setCodeLoading(false);
    }
  };

  return (
    <div className="search-modal-overlay" onClick={() => { console.log("[SearchUser] Overlay clicked. Triggering onClose..."); onClose(); }}>
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
            onClick={() => { console.log("[SearchUser] Switched tab to 'users'"); setActiveTab('users'); setExpandedId(null); }}
          >
            Identities ({counts.users})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`} 
            onClick={() => { console.log("[SearchUser] Switched tab to 'groups'"); setActiveTab('groups'); setExpandedId(null); }}
          >
            Groups ({counts.groups})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'channel' ? 'active' : ''}`} 
            onClick={() => { console.log("[SearchUser] Switched tab to 'channel'"); setActiveTab('channel'); setExpandedId(null); }}
          >
            Channels ({counts.channels})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`} 
            onClick={() => { console.log("[SearchUser] Switched tab to 'code'"); setActiveTab('code'); setExpandedId(null); }}
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
                  onClick={() => { console.log("[SearchUser] Item profile clicked:", item.public_id); onViewProfile(item); }} 
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