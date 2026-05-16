import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Plus, Shield, 
  MessageSquarePlus, Users, Radio, UserPlus,
  User, LogOut, Settings as SettingsIcon, Key, ShieldCheck, X, Disc,
  Megaphone,
  Bookmark,
  Music,
  Hash,
  Globe,
  HardDrive,
  Compass,
  Rss
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
// @ts-ignore
import { SearchUsers, GetAvailableAccounts, SwitchToAccount, DecryptMessage } from '../../wailsjs/go/main/App';
import Contacts from './Contacts';
import DiscordIcon from './DiscordIcon';
import Chat from './Chat';
import OtherProfile from './OtherProfile';
import SearchUser from './SearchUser';
import Settings from './Settings'; 
import CreateChannel from './CreateChannel';
import Channel from './Channel';
import { useCacheStore } from '../components/services/cacheManager';
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
          <div className="plus-icon"><Plus size={18} /></div>
          <span>Add New Identity</span>
        </button>
      </div>
    </div>
  );
}

export default function Dashboard({ myID, setActiveScreen, profile, onLogout }: DashboardProps) {
  const CACHE_KEY = useMemo(() => `liora_convs_${myID}`, [myID]);
  const [activeTab, setActiveTab] = useState('messages'); 
  const [messageFilter, setMessageFilter] = useState<'direct' | 'groups' | 'channels'>('direct');
  
  const { conversations, channels, isLoaded, loadFromStorage, setCache, updateLastMessage } = useCacheStore();
  
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

  const actionMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const fetchCounterRef = useRef(0);

  useEffect(() => {
    const generateDicebear = (id: string) => `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`;
    if (profile?.avatar_url && profile.avatar_url.trim() !== "") {
      setAvatar(`${profile.avatar_url}?t=${Date.now()}`);
    } else {
      setAvatar(generateDicebear(myID));
    }
  }, [profile, myID]);

  useEffect(() => {
    loadFromStorage(myID);
  }, [myID, loadFromStorage]);

  const fetchAllData = async () => {
    console.log("Fetching all dashboard data...");
    const currentFetchId = ++fetchCounterRef.current;

    const { data: chanData, error: chanError } = await supabase
      .from('channels')
      .select('*');

    let loadedChannels: any[] = [];
    if (!chanError && chanData) {
      loadedChannels = chanData.map(c => ({
        ...c,
        type: 'channel',
        displayID: `channel_${c.id}`, 
        username: c.name,
        last_message: "Public Channel Content"
      }));
    }

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('sender_id, recipient_id, content, created_at')
      .or(`sender_id.eq.${myID},recipient_id.eq.${myID}`)
      .order('created_at', { ascending: false });

    if (msgError || !messages) {
      console.error("Error loading messages:", msgError);
      if (currentFetchId === fetchCounterRef.current) {
        setCache(myID, { ...useCacheStore.getState(), channels: loadedChannels });
      }
      return;
    }

    const partnersMap = new Map();
    messages.forEach(m => {
      const partnerId = m.sender_id === myID ? m.recipient_id : m.sender_id;
      
      if (partnerId && partnerId !== myID) {
        if (!partnersMap.has(partnerId)) {
          partnersMap.set(partnerId, { last_content: m.content, last_time: m.created_at });
        }
      }
    });
    
    const uniquePartnerIds = Array.from(partnersMap.keys());
    
    if (uniquePartnerIds.length === 0) {
      if (currentFetchId === fetchCounterRef.current) {
        setCache(myID, { conversations: [], channels: loadedChannels });
      }
      return;
    }
    
    const { data: profilesData, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .in('public_id', uniquePartnerIds);
    
    if (!profError && profilesData) {
      const enriched = await Promise.all(profilesData.map(async (user) => {
        const msgData = partnersMap.get(user.public_id);
        let preview = "Encrypted message";
        
        try {
          const decrypted = await DecryptMessage(user.public_id, msgData.last_content);
          if (decrypted) preview = decrypted;
        } catch (e) {
          console.error("Decrypt preview failed", e);
        }

        return {
          ...user,
          type: 'direct', 
          displayID: user.public_id,
          last_message: preview,
          last_message_time: msgData.last_time
        };
      }));

      const sorted = enriched.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );
      
      if (currentFetchId === fetchCounterRef.current) {
        setCache(myID, { conversations: sorted, channels: loadedChannels });
      }
    }
  };

  useEffect(() => {
    fetchAllData();

    const channelSubscription = supabase.channel(`dashboard-updates:${myID}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
    const newMsg = payload.new;
    
    const isChannelMsg = !!newMsg.channel_id;
    const isDirectMsg = newMsg.sender_id === myID || newMsg.recipient_id === myID;

    if (isDirectMsg || isChannelMsg) {
      const partnerId = isChannelMsg 
        ? newMsg.channel_id.toString()
        : (newMsg.sender_id === myID ? newMsg.recipient_id : newMsg.sender_id);

      let preview = isChannelMsg ? newMsg.content : "Encrypted message";

      if (!isChannelMsg) {
        try {
          const decrypted = await DecryptMessage(partnerId, newMsg.content);
          if (decrypted) preview = decrypted;
        } catch(e) {
          console.error("Dashboard decryption error:", e);
        }
      }
      
      await updateLastMessage(myID, partnerId, preview, newMsg.created_at);
    }
  })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, () => {
    fetchAllData();
  })
  .subscribe();

    return () => {
      supabase.removeChannel(channelSubscription);
    };
  }, [myID, updateLastMessage]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setIsActionMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredList = useMemo(() => {
    if (messageFilter === 'channels') return channels;
    if (messageFilter === 'groups') return []; 
    
    if (messageFilter === 'direct') {
      if (activeChat && activeChat.type === 'direct' && !conversations.some(c => c.displayID === activeChat.displayID)) {
        return [activeChat, ...conversations];
      }
      return conversations;
    }
    return [];
  }, [messageFilter, conversations, channels, activeChat]);

  const handleActionClick = (action: string) => {
    setIsActionMenuOpen(false);
    if (action === 'create_channel') {
      setIsCreateChannelOpen(true);
    } else {
      setIsSearchOpen(true);
    }
  };

  return (
    <div className="messenger-layout">
      <aside className="main-sidebar">
        <div className="profile-menu-container" ref={profileMenuRef}>
          <div 
            className={`profile-mini ${isProfileMenuOpen ? 'active' : ''}`} 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          >
            <img 
              src={avatar} 
              alt="Me" 
              className="sidebar-img" 
              onError={(e) => e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${myID}`} 
            />
          </div>
          
          {isProfileMenuOpen && (
            <div className="profile-dropdown glass-morphism animate-pop">
              <button onClick={() => { setActiveScreen('profile'); setIsProfileMenuOpen(false); }}>
                <User size={18} />
                <span>My Profile</span>
              </button>
              <button onClick={() => { setIsSwitcherOpen(true); setIsProfileMenuOpen(false); }}>
                <Users size={18} />
                <span>Switch Identity</span>
              </button>
              <div className="divider"></div>
              <button className="logout-btn" onClick={onLogout}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        <nav className="side-nav">
          <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')}>
            <MessageSquarePlus size={22} />
            <span className="tooltip">Messages</span>
          </button>
          
          <button className={activeTab === 'contacts' ? 'active' : ''} onClick={() => setActiveTab('contacts')}>
            <Users size={22} />
            <span className="tooltip">Contacts</span>
          </button>

          <button className={activeTab === 'bookmarks' ? 'active' : ''} onClick={() => setActiveTab('bookmarks')}>
            <Bookmark size={22} />
            <span className="tooltip">Saved</span>
          </button>

          <button className={activeTab === 'music' ? 'active' : ''} onClick={() => setActiveTab('music')}>
            <Music size={22} />
            <span className="tooltip">Music</span>
          </button>

          <button className={activeTab === 'explore' ? 'active' : ''} onClick={() => setActiveTab('explore')}>
            <Compass size={22} />
            <span className="tooltip">Explore</span>
          </button>

          <button className={activeTab === 'Drive' ? 'active' : ''} onClick={() => setActiveTab('Drive')}>
            <HardDrive size={22} />
            <span className="tooltip">Drive</span>
          </button>

          <button className={activeTab === 'RSS' ? 'active' : ''} onClick={() => setActiveTab('RSS')}>
            <Rss size={22} />
            <span className="tooltip">RSS</span>
          </button>

          <div className="nav-spacer"></div>

          <button onClick={() => window.open('https://discord.gg/JjcTWnr8rm', '_blank')}>
            <DiscordIcon size={22} />
            <span className="tooltip">Support</span>
          </button>

          <button onClick={() => setIsSettingsOpen(true)}>
            <SettingsIcon size={22} />
            <span className="tooltip">Settings</span>
          </button>
        </nav>
      </aside>

      <section className="chat-list-section">
        <header className="list-header">
          <div className="brand-box">
            <img src={userPhoto} alt="Liora Logo" style={{ width: '40px', height: '40px' }} />
            <h1>Liora</h1>
          </div>
          
          <div className="action-menu-container" ref={actionMenuRef}>
            <button className="icon-btn" onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}>
              <Plus size={20} />
            </button>
            
            {isActionMenuOpen && (
              <div className="action-dropdown glass-morphism animate-pop">
                <button onClick={() => handleActionClick('new_chat')}>
                  <MessageSquarePlus size={18} />
                  <span>Start Direct Chat</span>
                </button>
                <button onClick={() => handleActionClick('create_channel')}>
                  <Megaphone size={18} />
                  <span>Create Channel</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="message-type-switcher">
          <button className={messageFilter === 'direct' ? 'active' : ''} onClick={() => setMessageFilter('direct')}>Dm</button>
          <button className={messageFilter === 'groups' ? 'active' : ''} onClick={() => setMessageFilter('groups')}>Groups</button>
          <button className={messageFilter === 'channels' ? 'active' : ''} onClick={() => setMessageFilter('channels')}>Channels</button>
        </div>

        <div className="search-box" onClick={() => setIsSearchOpen(true)}>
          <div className="search-icon">
            <Search size={16} />
          </div>
          <input type="text" placeholder="Search identities..." readOnly />
        </div>

        <div className="conversations">
          {filteredList.length === 0 ? (
            <div className="empty-list-info">
              <p>{!isLoaded ? "Loading..." : "No conversations found"}</p>
            </div>
          ) : (
            filteredList.map((item) => (
              <div 
                key={item.displayID} 
                className={`conv-item ${activeChat?.displayID === item.displayID ? 'active' : ''}`}
                onClick={() => setActiveChat(item)}
              >
                <div className="conv-avatar">
                  {item.avatar_url ? (
                    <img src={item.avatar_url} className="avatar-img" alt="" />
                  ) : item.type === 'channel' ? (
                    <div className="initials-avatar channel-avatar-placeholder">
                      {(item.username || item.name || "CH").slice(0, 2).toUpperCase()}
                    </div>
                  ) : (
                    <div className="initials-avatar">
                      {(item.username || item.name || "UN").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="conv-content">
                  <div className="conv-title">
                    <span className="name">{item.username || item.name}</span>
                    {item.last_message_time && (
                      <span className="conv-time">
                        {new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="last-message">{item.last_message || "No messages yet"}</p>
                </div>
                
                {item.type === 'channel' && <div className="channel-badge">Public</div>}
              </div>
            ))
          )}
        </div>
      </section>

      <main className="chat-view">
        <div className="noise"></div>
        
        {activeChat ? (
          activeChat.type === 'channel' ? (
            <Channel 
              channel={activeChat} 
              myID={myID} 
              onBack={() => setActiveChat(null)} 
            />
          ) : (
            <Chat 
              activeChat={activeChat} 
              myID={myID} 
              onOpenProfile={() => setViewingUser(activeChat)} 
            />
          )
        ) : (
          <div className="empty-state">
            <div className="shield-icon">
              <img src={userPhoto} alt="Liora Security" style={{ width: '120px', borderRadius: '50%' }} />
            </div>
            <h2>Liora Secure Environment</h2>
            <p>Every message is encrypted locally before transit.</p>
            <div className="id-badge">
              <span className="label">ACTIVE_ID:</span>
              <code>{myID}</code>
            </div>
          </div>
        )}
      </main>

      {isSearchOpen && (
        <SearchUser 
          onClose={() => setIsSearchOpen(false)} 
          onViewProfile={(user: any) => { 
            setActiveChat({
              ...user,
              type: 'direct',
              displayID: user.public_id
            });
            setIsSearchOpen(false);
          }} 
        />
      )}
      
      {viewingUser && (
        <OtherProfile 
          user={viewingUser} 
          onClose={() => setViewingUser(null)} 
          onStartChat={(user) => { 
            setActiveChat({
              ...user, 
              type: 'direct', 
              displayID: user.public_id
            }); 
            setViewingUser(null); 
          }} 
          onAddContact={() => {}} 
        />
      )}

      {isSettingsOpen && (
        <Settings onBack={() => setIsSettingsOpen(false)} />
      )}

      {isCreateChannelOpen && (
        <CreateChannel 
          myID={myID} 
          onClose={() => setIsCreateChannelOpen(false)} 
          onCreated={(newChan) => {
            fetchAllData();
            setActiveChat({
              ...newChan, 
              type: 'channel', 
              displayID: `channel_${newChan.id}`
            });
            setIsCreateChannelOpen(false);
          }} 
        />
      )}

      {isSwitcherOpen && (
        <div className="modal-overlay" onClick={() => setIsSwitcherOpen(false)}>
          <div className="modal-content-wrapper" onClick={e => e.stopPropagation()}>
            <AccountSwitcher 
              onSelect={async (id) => { 
                await SwitchToAccount(id); 
                window.location.reload(); 
              }}
              onAddNew={() => { 
                localStorage.removeItem(CACHE_KEY); 
                onLogout(); 
              }}
            />
            <button className="close-switcher-btn" onClick={() => setIsSwitcherOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}