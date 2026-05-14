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
import Chat from './Chat';
import OtherProfile from './OtherProfile';
import SearchUser from './SearchUser';
import Settings from './Settings'; 
import CreateChannel from './CreateChannel';
import Channel from './Channel';
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

const saveDashboardCache = (myID: string, data: { conversations: any[], channels: any[], profile: any }) => {
  const cache = {
    timestamp: Date.now(),
    conversations: data.conversations,
    channels: data.channels,
    profile: data.profile
  };
  localStorage.setItem(`liora_full_cache_${myID}`, JSON.stringify(cache));
};

const DiscordIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
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
  const [conversations, setConversations] = useState<any[]>(() => {
  const saved = localStorage.getItem(`liora_full_cache_${myID}`);
  return saved ? JSON.parse(saved).conversations : [];
});

const [channels, setChannels] = useState<any[]>(() => {
  const saved = localStorage.getItem(`liora_full_cache_${myID}`);
  return saved ? JSON.parse(saved).channels : [];
});
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

  useEffect(() => {
    const generateDicebear = (id: string) => `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`;
    if (profile?.avatar_url && profile.avatar_url.trim() !== "") {
      setAvatar(`${profile.avatar_url}?t=${Date.now()}`);
    } else {
      setAvatar(generateDicebear(myID));
    }
  }, [profile, myID]);

  const fetchAllData = async () => {
    console.log("Fetching all dashboard data...");

    const { data: chanData, error: chanError } = await supabase
      .from('channels')
      .select('*');

    if (!chanError && chanData) {
      setChannels(chanData.map(c => ({
        ...c,
        type: 'channel',
        displayID: `channel_${c.id}`, 
        username: c.name,
        last_message: "Public Channel Content"
      })));
    }

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('sender_id, recipient_id, content, created_at')
      .or(`sender_id.eq.${myID},recipient_id.eq.${myID}`)
      .order('created_at', { ascending: false });

    if (msgError || !messages) return;

    const partnersMap = new Map();
    messages.forEach(m => {
      const partnerId = m.sender_id === myID ? m.recipient_id : m.sender_id;
      if (!partnersMap.has(partnerId)) {
        partnersMap.set(partnerId, { last_content: m.content, last_time: m.created_at });
      }
    });
    
    const uniquePartnerIds = Array.from(partnersMap.keys());
    
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
      setConversations(sorted);
    }
  };

  useEffect(() => {
    fetchAllData();

    const channelSubscription = supabase.channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, () => {
        fetchAllData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelSubscription);
    };
  }, [myID]);

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
    if (messageFilter === 'direct') return conversations;
    if (messageFilter === 'channels') return channels;
    if (messageFilter === 'groups') return []; 
    return [];
  }, [messageFilter, conversations, channels]);

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
          <button 
            className={activeTab === 'messages' ? 'active' : ''} 
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquarePlus size={22} />
            <span className="tooltip">Messages</span>
          </button>
          
          <button 
            className={activeTab === 'bookmarks' ? 'active' : ''} 
            onClick={() => setActiveTab('bookmarks')}
          >
            <Bookmark size={22} />
            <span className="tooltip">Saved</span>
          </button>

          <button 
            className={activeTab === 'music' ? 'active' : ''} 
            onClick={() => setActiveTab('music')}
          >
            <Music size={22} />
            <span className="tooltip">Music</span>
          </button>

          <button 
            className={activeTab === 'explore' ? 'active' : ''} 
            onClick={() => setActiveTab('explore')}
          >
            <Compass size={22} />
            <span className="tooltip">Explore</span>
          </button>

          <button 
            className={activeTab === 'Drive' ? 'active' : ''} 
            onClick={() => setActiveTab('Drive')}
          >
            <HardDrive size={22} />
            <span className="tooltip">Drive</span>
          </button>

          <button 
            className={activeTab === 'RSS' ? 'active' : ''} 
            onClick={() => setActiveTab('RSS')}
          >
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
          <button 
            className={messageFilter === 'direct' ? 'active' : ''} 
            onClick={() => setMessageFilter('direct')}
          >
            Dm
          </button>
          <button 
            className={messageFilter === 'groups' ? 'active' : ''} 
            onClick={() => setMessageFilter('groups')}
          >
            Groups
          </button>
          <button 
            className={messageFilter === 'channels' ? 'active' : ''} 
            onClick={() => setMessageFilter('channels')}
          >
            Channels
          </button>
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
              <p>No conversations found</p>
            </div>
          ) : (
            filteredList.map((item) => (
              <div 
                key={item.displayID} 
                className={`conv-item ${activeChat?.displayID === item.displayID ? 'active' : ''}`}
                onClick={() => setActiveChat(item)}
              >
                <div className="conv-avatar">
                  {item.type === 'channel' ? (
                    <div className="channel-icon-circle"><Hash size={20} /></div>
                  ) : item.avatar_url ? (
                    <img src={item.avatar_url} className="avatar-img" alt="" />
                  ) : (
                    <div className="initials-avatar">
                      {item.username?.slice(0, 2).toUpperCase() || "UN"}
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
                  <p className="last-message">{item.last_message}</p>
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
          onStartChat={(user: any) => {
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