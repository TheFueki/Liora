import { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Shield, UserCircle, 
  MessageSquarePlus, Users, Radio, UserPlus 
} from 'lucide-react';
import { GetProfile, SearchUsers } from '../../wailsjs/go/main/App';
import Contacts from './Contacts';
import OtherProfile from './OtherProfile';
import MiniProfile from './MiniProfile';
import SearchUser from './SearchUser';
import '../styles/Dashboard.scss';

interface DashboardProps {
  myID: string;
  setActiveScreen: (screen: 'register' | 'dashboard' | 'profile' | 'settings') => void;
}

export default function Dashboard({ myID, setActiveScreen }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('chats');
  const [showContacts, setShowContacts] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncProfile = async () => {
      try {
        const data = await GetProfile();
        if (data && data.avatar_url) {
          setAvatar(data.avatar_url);
        } else {
          setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${myID}`);
        }
      } catch (err) {
        setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${myID}`);
      }
    };
    syncProfile();
  }, [myID]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const users = await SearchUsers(searchQuery);
          setSearchResults(users || []);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleAction = (type: string) => {
    setIsActionMenuOpen(false);
    if (type === 'new_chat' || type === 'create_group' || type === 'create_channel' || type === 'add_contact') {
      setIsSearchOpen(true);
    }
    console.log("Action triggered:", type);
  };

  const handleSelectUser = (user: any) => {
    setViewingUser(user);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="messenger-layout">
      <aside className="main-sidebar">
        <div className="profile-mini" onClick={() => setActiveScreen('profile')} title="My Identity">
          <div className="avatar-placeholder">
            {avatar ? (
              <img src={avatar} alt="Me" className="sidebar-img" />
            ) : (
              <UserCircle size={26} strokeWidth={1.2} />
            )}
            <div className="online-indicator"></div>
          </div>
        </div>

        <nav className="side-nav">
          <button
            className={activeTab === 'chats' ? 'active' : ''}
            onClick={() => setActiveTab('chats')}
          >
            <MessageSquarePlus size={22} strokeWidth={1.5} />
            <span className="tooltip">Messages</span>
          </button>

          <button
            className={showContacts ? 'active' : ''}
            onClick={() => setShowContacts(!showContacts)}
          >
            <Users size={22} strokeWidth={1.5} />
            <span className="tooltip">Contacts</span>
          </button>

          <div className="nav-spacer"></div>

          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveScreen('settings')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span className="tooltip">Settings</span>
          </button>
        </nav>
      </aside>

      <section className="chat-list-section">
        <header className="list-header">
          <h1>Liora</h1>
          <div className="action-menu-container" ref={actionMenuRef}>
            <button 
              className={`icon-btn ${isActionMenuOpen ? 'active' : ''}`} 
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
            >
              <Plus size={20} />
            </button>

            {isActionMenuOpen && (
              <div className="action-dropdown glass-morphism animate-pop">
                <button onClick={() => handleAction('new_chat')}>
                  <MessageSquarePlus size={18} />
                  <span>New Chat</span>
                </button>
                <button onClick={() => handleAction('create_group')}>
                  <Users size={18} />
                  <span>Create Group</span>
                </button>
                <button onClick={() => handleAction('create_channel')}>
                  <Radio size={18} />
                  <span>Create Channel</span>
                </button>
                <button onClick={() => handleAction('add_contact')}>
                  <UserPlus size={18} />
                  <span>Add Contact</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="search-box" onClick={() => setIsSearchOpen(true)}>
          <Search size={16} className={`search-icon ${isSearching ? 'spinning' : ''}`} />
          <input
            type="text"
            placeholder="Search identities..."
            value={searchQuery}
            readOnly
          />
        </div>

        <div className="conversations">
          {searchQuery.length >= 2 ? (
            searchResults.map((user) => (
              <div
                key={user.public_id}
                className="conv-item"
                onMouseEnter={() => setHoveredUserId(user.public_id)}
                onMouseLeave={() => setHoveredUserId(null)}
                onClick={() => handleSelectUser(user)}
                style={{ position: 'relative' }}
              >
                <div className="conv-avatar">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="conv-content">
                  <div className="conv-title">
                    <span className="name">{user.username}</span>
                  </div>
                  <p className="last-message">ID: {user.public_id.slice(0, 8)}</p>
                </div>

                {hoveredUserId === user.public_id && (
                  <MiniProfile user={user} />
                )}
              </div>
            ))
          ) : (
            <div className="conv-item active">
              <div className="conv-avatar">
  <img src="https://i.pinimg.com/originals/45/27/74/452774670c4278039206d96226dc7f8a.jpg" alt="Ava" className="avatar-img" />
</div>
              <div className="conv-content">
                <div className="conv-title">
                  <span className="name">Durov</span>
                  <span className="time">22:45</span>
                </div>
                <p className="last-message">Hey Son.</p>
              </div>
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className="empty-search-msg">No identities found</div>
          )}
        </div>
      </section>

      <main className="chat-view">
        <div className="noise"></div>
        <div className="empty-state">
          <div className="shield-icon">
            <Shield size={48} strokeWidth={1} />
          </div>
          <h2>Anonymous messenger</h2>
          <p>Your account is defended via <strong>Ed25519</strong> encryption and your messages are protected by E2ee. <strong>perfect forward secrecy</strong>.</p>
          <div className="id-badge">
            <span className="label">YOUR_ID:</span>
            <code>{myID.substring(0, 16)}...</code>
          </div>
        </div>
      </main>

      {showContacts && <Contacts onClose={() => setShowContacts(false)} />}

      {isSearchOpen && (
        <SearchUser
          onClose={() => setIsSearchOpen(false)}
          onSelectUser={(user: any) => {
            setViewingUser(user);
            setIsSearchOpen(false);
          }}
        />
      )}

      {viewingUser && (
        <OtherProfile
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          onAddContact={(id: string) => console.log("Added:", id)}
        />
      )}
    </div>
  );
}