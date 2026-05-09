import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Plus, Shield, 
  MessageSquarePlus, Users, Radio, UserPlus,
  User, LogOut, Settings as SettingsIcon, Key, ShieldCheck, X, Disc,
  Megaphone,
  Bookmark,
  Music
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
// @ts-ignore
import { SearchUsers, GetAvailableAccounts, SwitchToAccount, DecryptMessage } from '../../wailsjs/go/main/App';
import Contacts from './Contacts';
import Chat from './Chat';
import OtherProfile from './OtherProfile';
import SearchUser from './SearchUser';
import Settings from './Settings'; 
import '../styles/Dashboard.scss';
import userPhoto from '../assets/liora1.png';

interface Account {
  id: string;
  username: string;
  avatarUrl?: string;
}

interface DashboardProps {
  myID: string;
  setActiveScreen: (screen: 'register' | 'dashboard' | 'profile' | 'settings') => void;
  profile: any;
  onLogout: () => void; 
}
const DiscordIcon = ({ size = 22 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 127.14 96.36" 
    fill="#5865F2" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.73,32.98-1.86,57.21.35,81c11.1,8.19,21.89,13.2,32.46,16.45a75.6,75.6,0,0,0,7.57-12.33A66.59,66.59,0,0,1,29.83,79.08c.88-.65,1.74-1.33,2.58-2.05,21.08,9.76,43.91,9.76,64.73,0a35.53,35.53,0,0,0,2.58,2.05,66.1,66.1,0,0,1-10.56,6.07,75.62,75.62,0,0,0,7.57,12.33c10.58-3.25,21.37-8.26,32.46-16.45C130.58,52.25,124.3,28.33,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.07-12.72,11.41-12.72S54,46,53.86,53,48.82,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.07-12.72,11.41-12.72S96.18,46,96,53,91,65.69,84.69,65.69Z"/>
  </svg>
);

function AccountSwitcher({ onSelect, onAddNew }: { onSelect: (id: string) => void, onAddNew: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    GetAvailableAccounts().then((data: Account[]) => {
      setAccounts(data || []);
    }).catch(console.error);
  }, []);

  return (
    <div className="account-switcher glass-morphism animate-pop">
      <div className="switcher-header">
        <ShieldCheck size={20} className="text-green" />
        <h3>Active Identities</h3>
      </div>
      
      <div className="accounts-list">
        {accounts.map(acc => {
          const avatar = acc.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${acc.id}`;
          return (
            <div key={acc.id} className="account-item" onClick={() => onSelect(acc.id)}>
              <div className="avatar-wrapper">
                <img src={avatar} alt={acc.username} className="account-avatar" />
                <div className="status-indicator online"></div>
              </div>
              <div className="account-info">
                <span className="account-name">{acc.username || "Anonymous"}</span>
                <span className="account-id">{acc.id.slice(0, 12)}...</span>
              </div>
            </div>
          );
        })}
        
        <button className="add-account-btn" onClick={onAddNew}>
          <div className="plus-icon">
            <Plus size={18} />
          </div>
          <span>Add New Identity</span>
        </button>
      </div>
    </div>
  );
}

export default function Dashboard({ myID, setActiveScreen, profile, onLogout }: DashboardProps) {
  const CACHE_KEY = useMemo(() => `liora_convs_${myID}`, [myID]);

  const [activeTab, setActiveTab] = useState('chats');
  const [conversations, setConversations] = useState<any[]>(() => {
    const saved = localStorage.getItem(CACHE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showContacts, setShowContacts] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 

  const actionMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(conversations));
    }
  }, [conversations, CACHE_KEY]);

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
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setIsActionMenuOpen(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setIsProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchConversations = async () => {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('sender_id, recipient_id, content, created_at')
      .or(`sender_id.eq.${myID},recipient_id.eq.${myID}`)
      .order('created_at', { ascending: false });

    if (error || !messages || messages.length === 0) return;

    if (conversations.length > 0 && conversations[0].last_message_time === messages[0].created_at) {
      return;
    }

    const partnersMap = new Map();
    messages.forEach(m => {
      const partnerId = m.sender_id === myID ? m.recipient_id : m.sender_id;
      if (!partnersMap.has(partnerId)) {
        partnersMap.set(partnerId, {
          last_content: m.content,
          last_time: m.created_at
        });
      }
    });
    
    const uniquePartnerIds = Array.from(partnersMap.keys());
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('public_id', uniquePartnerIds);
    
    if (profiles) {
      const enriched = await Promise.all(profiles.map(async (user) => {
        const msgData = partnersMap.get(user.public_id);
        let decryptedPreview = "Encrypted message";
        try {
          decryptedPreview = await DecryptMessage(user.public_id, msgData.last_content);
        } catch (e) {
          console.error("Preview decryption failed", e);
        }
        return {
          ...user,
          last_message: decryptedPreview,
          last_message_time: msgData.last_time
        };
      }));

      enriched.sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());
      setConversations(enriched);
    }
  };

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('global-dashboard-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const newMsg = payload.new;
        const partnerId = newMsg.sender_id === myID ? newMsg.recipient_id : newMsg.sender_id;
        
        try {
          const clearText = await DecryptMessage(partnerId, newMsg.content);
          setConversations(prev => {
            const exists = prev.find(c => c.public_id === partnerId);
            if (exists) {
              return prev.map(c => c.public_id === partnerId 
                ? { ...c, last_message: clearText, last_message_time: newMsg.created_at } 
                : c
              ).sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());
            } else {
              fetchConversations();
              return prev;
            }
          });
        } catch (e) {
          fetchConversations();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myID]);

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
    if (!conversations.find(c => c.public_id === user.public_id)) {
        setConversations([{ ...user, last_message: "No messages yet" }, ...conversations]);
    }
    setActiveTab('chats');
    setViewingUser(null);
  };

  return (
    <div className="messenger-layout">
      <aside className="main-sidebar">
        <div className="profile-menu-container" ref={profileMenuRef}>
          <div 
            className={`profile-mini ${isProfileMenuOpen ? 'active' : ''}`} 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} 
          >
            <div className="avatar-placeholder">
              <img 
                src={avatar} 
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

          {isProfileMenuOpen && (
            <div className="profile-dropdown glass-morphism animate-pop">
              <button onClick={() => { setActiveScreen('profile'); setIsProfileMenuOpen(false); }}>
                <User size={18} />
                <span>My Profile</span>
              </button>

              <button onClick={() => { setIsSwitcherOpen(true); setIsProfileMenuOpen(false); }}>
                <Users size={18} />
                <span>Switch Account</span>
              </button>

              <button onClick={() => { setIsSettingsOpen(true); setIsProfileMenuOpen(false); }}>
                <SettingsIcon size={18} />
                <span>Settings</span>
              </button>
            </div>
          )}
        </div>

        <nav className="side-nav">
  <button className={activeTab === 'chats' ? 'active' : ''} onClick={() => setActiveTab('chats')}>
    <MessageSquarePlus size={22} strokeWidth={1.5} />
    <span className="tooltip">Messages</span>
  </button>

  <button className={activeTab === 'groups' ? 'active' : ''} onClick={() => setActiveTab('groups')}>
    <Users size={22} strokeWidth={1.5} />
    <span className="tooltip">Groups</span>
  </button>

  <button className={showContacts ? 'active' : ''} onClick={() => setShowContacts(!showContacts)}>
    <User size={22} strokeWidth={1.5} />
    <span className="tooltip">Contacts</span>
  </button>

  <button className={activeTab === 'Bookmark' ? 'active' : ''} onClick={() => setActiveTab('Bookmark')}>
    <Bookmark size={22} strokeWidth={1.5} />
    <span className="tooltip">Bookmark</span>
  </button>

  <button className={activeTab === 'Music' ? 'active' : ''} onClick={() => setActiveTab('Music')}>
    <Music size={22} strokeWidth={1.5} />
    <span className="tooltip">Music</span>
  </button>

   <div className="nav-spacer"></div>

  <button onClick={() => window.open('https://discord.gg/JjcTWnr8rm', '_blank')}>
  <DiscordIcon size={22} />
  <span className="tooltip">Discord</span>
</button>

  <button onClick={() => setIsSettingsOpen(true)}>
    <SettingsIcon size={22} strokeWidth={1.5} />
    <span className="tooltip">Settings</span>
  </button>
</nav>
      </aside>

      <section className="chat-list-section">
        <header className="list-header">
          <div className="brand-box" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
           <img 
            src={userPhoto} 
            alt="Liora Logo" 
            style={{ 
            width: '48px',  
            height: '48px', 
           }} 
           />
  <h1>Liora</h1>
</div>
          <div className="action-menu-container" ref={actionMenuRef}>
            <button className={`icon-btn ${isActionMenuOpen ? 'active' : ''}`} onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}>
              <Plus size={20} />
            </button>
            {isActionMenuOpen && (
              <div className="action-dropdown glass-morphism animate-pop">
                <button onClick={() => handleAction('new_chat')}><MessageSquarePlus size={18} /><span>New Chat</span></button>
                <button onClick={() => handleAction('create_group')}><Users size={18} /><span>Create Group</span></button>
                <button onClick={() => handleAction('create_channel')}><Megaphone size={18} strokeWidth={1.5} />  <span>Create Channel</span></button>
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
              <div key={user.public_id} className="conv-item" onClick={() => handleSelectUser(user)}>
                <div className="conv-avatar">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.username} 
                      className="avatar-img" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerText = user.username?.slice(0, 2).toUpperCase() || "??";
                      }}
                    />
                  ) : (
                    user.username ? user.username.slice(0, 2).toUpperCase() : "??"
                  )}
                </div>
                <div className="conv-content">
                  <div className="conv-title"><span className="name">{user.username || "Unknown"}</span></div>
                  <p className="last-message">ID: {user.public_id.slice(0, 8)}</p>
                </div>
              </div>
            ))
          ) : (
            <>
              {conversations.map((conv) => (
                <div 
                  key={conv.public_id} 
                  className={`conv-item ${activeChat?.public_id === conv.public_id ? 'active' : ''}`}
                >
                  <div 
                    className="conv-avatar" 
                    onClick={(e) => { e.stopPropagation(); setViewingUser(conv); }}
                    style={{ cursor: 'pointer' }}
                  >
                    {conv.avatar_url ? (
                      <img 
                        src={conv.avatar_url} 
                        alt={conv.username} 
                        className="avatar-img" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerText = conv.username?.slice(0, 2).toUpperCase() || "??";
                        }}
                      />
                    ) : (
                      conv.username?.slice(0, 2).toUpperCase() || "??"
                    )}
                  </div>
                  <div className="conv-content" onClick={() => setActiveChat(conv)}>
                    <div className="conv-title">
                      <span 
                        className="name" 
                        onClick={(e) => { e.stopPropagation(); setViewingUser(conv); }}
                        style={{ cursor: 'pointer' }}
                      >
                        {conv.username}
                      </span>
                      {conv.last_message_time && (
                        <span className="conv-time">
                          {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    
                    <p className="last-message">
                      {conv.last_message ? (
                        conv.last_message.length > 30 
                          ? conv.last_message.substring(0, 30) + "..." 
                          : conv.last_message
                      ) : (
                        "Write a message..."
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      <main className="chat-view">
        <div className="noise"></div>
        {activeChat ? (
          <Chat 
            activeChat={activeChat} 
            myID={myID} 
            onOpenProfile={() => setViewingUser(activeChat)} 
          />
        ) : (
          <div className="empty-state">
  <div className="shield-icon">
    <img 
    src={userPhoto} 
    alt="User Profile" 
    style={{ 
      width: '96px',   
      height: '96px',  
      borderRadius: '50%',
      objectFit: 'cover'  
    }} 
  />
  </div>
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

      {isSettingsOpen && <Settings onBack={() => setIsSettingsOpen(false)} />}

      {isSwitcherOpen && (
        <div className="modal-overlay" onClick={() => setIsSwitcherOpen(false)}>
          <div className="modal-content-wrapper" onClick={e => e.stopPropagation()}>
            <AccountSwitcher 
              onSelect={async (id: string) => {
                await SwitchToAccount(id);
                window.location.reload(); 
              }}
              onAddNew={() => {
                localStorage.removeItem(CACHE_KEY); 
                onLogout(); 
              }}
            />
            <button className="cancel-btn" onClick={() => setIsSwitcherOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}