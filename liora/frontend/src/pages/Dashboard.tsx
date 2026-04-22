import { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Shield, 
  MessageSquarePlus, Users, Radio, UserPlus 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { SearchUsers } from '../../wailsjs/go/main/App';
import Contacts from './Contacts';
import Chat from './Chat';
import OtherProfile from './OtherProfile';
import MiniProfile from './MiniProfile';
import SearchUser from './SearchUser';
import '../styles/Dashboard.scss';

interface DashboardProps {
  myID: string;
  setActiveScreen: (screen: 'register' | 'dashboard' | 'profile' | 'settings') => void;
  profile: any;
}

export default function Dashboard({ myID, setActiveScreen, profile }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('chats');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [showContacts, setShowContacts] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<any | null>(null);

  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateDicebear = (id: string) => `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`;
    if (profile?.avatar_url && profile.avatar_url.trim() !== "") {
      const separator = profile.avatar_url.includes('?') ? '&' : '?';
      setAvatar(`${profile.avatar_url}${separator}t=${Date.now()}`);
    } else {
      setAvatar(generateDicebear(myID));
    }
  }, [profile, myID]);

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
    if (!activeChat) return;
    const fetchLastMessage = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${myID},recipient_id.eq.${activeChat.public_id}),and(sender_id.eq.${activeChat.public_id},recipient_id.eq.${myID})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) setLastMessage(data);
    };
    fetchLastMessage();
    const channel = supabase
      .channel('dashboard-preview')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        (payload) => {
          const msg = payload.new as any;
          if ((msg.sender_id === myID && msg.recipient_id === activeChat.public_id) ||
              (msg.sender_id === activeChat.public_id && msg.recipient_id === myID)) {
            setLastMessage(msg);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChat, myID]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const users = await SearchUsers(searchQuery);
          setSearchResults(users || []);
        } catch (err) {
          console.error("Search failed:", err);
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
    if (['new_chat', 'create_group', 'create_channel', 'add_contact'].includes(type)) {
      setIsSearchOpen(true);
    }
  };

  const handleSelectUser = (user: any) => {
    setViewingUser(user);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleStartChat = (user: any) => {
    setActiveChat(user);
    setActiveTab('chats');
    setViewingUser(null);
  };

  return (
    <div className="messenger-layout">
      <aside className="main-sidebar">
        <div className="profile-mini" onClick={() => setActiveScreen('profile')} title="My Identity">
          <div className="avatar-placeholder">
            <img 
              src={avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${myID}`} 
              alt="Me" 
              className="sidebar-img" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${myID}`;
              }}
            />
            <div className="online-indicator"></div>
          </div>
          <div className="sidebar-username-label">
            {profile?.username || "New User"}
          </div>
        </div>

        <nav className="side-nav">
          <button className={activeTab === 'chats' ? 'active' : ''} onClick={() => setActiveTab('chats')}>
            <MessageSquarePlus size={22} strokeWidth={1.5} />
            <span className="tooltip">Messages</span>
          </button>

          <button className={showContacts ? 'active' : ''} onClick={() => setShowContacts(!showContacts)}>
            <Users size={22} strokeWidth={1.5} />
            <span className="tooltip">Contacts</span>
          </button>

          <div className="nav-spacer"></div>

          <button onClick={() => setActiveScreen('settings')}>
             <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
             </svg>
             <span className="tooltip">Settings</span>
          </button>
        </nav>
      </aside>

      <section className="chat-list-section">
        <header className="list-header">
          <h1>Liora</h1>
          <div className="action-menu-container" ref={actionMenuRef}>
            <button className={`icon-btn ${isActionMenuOpen ? 'active' : ''}`} onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}>
              <Plus size={20} />
            </button>
            {isActionMenuOpen && (
              <div className="action-dropdown glass-morphism animate-pop">
                <button onClick={() => handleAction('new_chat')}><MessageSquarePlus size={18} /><span>New Chat</span></button>
                <button onClick={() => handleAction('create_group')}><Users size={18} /><span>Create Group</span></button>
                <button onClick={() => handleAction('create_channel')}><Radio size={18} /><span>Create Channel</span></button>
                <button onClick={() => handleAction('add_contact')}><UserPlus size={18} /><span>Add Contact</span></button>
              </div>
            )}
          </div>
        </header>

        <div className="search-box" onClick={() => setIsSearchOpen(true)}>
          <Search size={16} className={`search-icon ${isSearching ? 'spinning' : ''}`} />
          <input type="text" placeholder="Search identities..." value={searchQuery} readOnly />
        </div>

        <div className="conversations">
          {searchQuery.length >= 2 ? (
            searchResults.map((user) => (
              <div key={user.public_id} className="conv-item" onMouseEnter={() => setHoveredUserId(user.public_id)} onMouseLeave={() => setHoveredUserId(null)} onClick={() => handleSelectUser(user)}>
                <div className="conv-avatar">{user.username ? user.username.slice(0, 2).toUpperCase() : "??"}</div>
                <div className="conv-content">
                  <div className="conv-title"><span className="name">{user.username || "Unknown"}</span></div>
                  <p className="last-message">ID: {user.public_id.slice(0, 8)}</p>
                </div>
                {hoveredUserId === user.public_id && <MiniProfile user={user} />}
              </div>
            ))
          ) : (
            <>
              {activeChat && (
                <div className="conv-item active">
                  <div className="conv-avatar">
                     {activeChat.username?.slice(0,2).toUpperCase()}
                  </div>
                  <div className="conv-content">
                    <div className="conv-title">
                      <span className="name">{activeChat.username}</span>
                      <span className="time">
                        {lastMessage ? new Date(lastMessage.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'}
                      </span>
                    </div>
                    <div className="last-message-wrapper">
                      <p className="last-message">
                        {lastMessage ? lastMessage.content : "Encrypted tunnel established..."}
                      </p>
                      {lastMessage && lastMessage.sender_id === myID && (
                        <span className={`status-tick ${lastMessage.is_read ? 'read' : ''}`}>
                          {lastMessage.is_read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="conv-item">
                <div className="conv-avatar">
                  <img src="https://i.pinimg.com/originals/45/27/74/452774670c4278039206d96226dc7f8a.jpg" alt="Ava" className="avatar-img" />
                </div>
                <div className="conv-content">
                  <div className="conv-title"><span className="name">Durov</span><span className="time">22:45</span></div>
                  <p className="last-message">Hey Son.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <main className="chat-view">
        <div className="noise"></div>
        
        {activeChat ? (
          <Chat activeChat={activeChat} myID={myID} />
        ) : (
          <div className="empty-state">
            <div className="shield-icon"><Shield size={48} strokeWidth={1} /></div>
            <h2>Anonymous messenger</h2>
            <p>Protected via <strong>Ed25519</strong> encryption.</p>
            <div className="id-badge">
              <span className="label">YOUR_ID:</span>
              <code>{myID.substring(0, 16)}...</code>
            </div>
          </div>
        )}
      </main>

      {showContacts && <Contacts onClose={() => setShowContacts(false)} />}
      {isSearchOpen && <SearchUser onClose={() => setIsSearchOpen(false)} onSelectUser={handleSelectUser} />}
      
      {viewingUser && (
        <OtherProfile 
          user={viewingUser} 
          onClose={() => setViewingUser(null)} 
          onAddContact={() => {}} 
          onStartChat={handleStartChat}
        />
      )}
    </div>
  );
}