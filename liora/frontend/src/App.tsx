import { useState, useEffect } from 'react';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile'; 
import Settings from './pages/Settings';
import Contacts from './pages/Contacts';
import SearchUser from './pages/SearchUser';
import CreateChannel from './pages/CreateChannel';
import Channel from './pages/Channel';
import './App.css';
import { GetMyInfo } from '../wailsjs/go/main/App';
import { EventsOn } from '../wailsjs/runtime'; 

type Screen = 'register' | 'dashboard' | 'profile' | 'settings' | 'contacts' | 'search' | 'create_channel' | 'channel';

function App() {
  const [screen, setScreen] = useState<Screen>('register');
  const [myID, setMyID] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = () => {
    return GetMyInfo()
      .then((profile) => {
        if (profile && profile.public_id) {
          setMyID(profile.public_id);
          setUserProfile({...profile}); 
          return profile;
        }
      })
      .catch(err => console.error("Refresh error:", err));
  };

  useEffect(() => {
    refreshProfile().then((profile) => {
      if (profile && profile.username) {
        setScreen('dashboard');
      } else {
        setScreen('register');
      }
    }).finally(() => setLoading(false));

    const off = EventsOn("profile_updated", () => {
      console.log("Global signal: profile updated!");
      refreshProfile();
    });

    return () => off(); 
  }, []);
  
  const handleLogout = async () => {
    setMyID("");
    setScreen('register');
  };
  const handleRegistrationComplete = (id: string) => {
    setMyID(id);
    refreshProfile().then(() => setScreen('dashboard'));
  };

  if (loading) return <div className="loading">Initializing Liora...</div>;

  return (
    <div className="liora-app-container">
      {screen === 'register' && (
        <Register onComplete={handleRegistrationComplete} />
      )}

      {screen === 'dashboard' && (
        <Dashboard 
          myID={myID} 
          profile={userProfile} 
          setActiveScreen={(s: Screen) => setScreen(s)} 
          onLogout={handleLogout}
        />
      )}

      {screen === 'profile' && (
        <Profile 
          myID={myID} 
          onBack={() => setScreen('dashboard')} 
        />
      )}

      {screen === 'settings' && 
        <Settings onBack={() => setScreen('dashboard')} />
      }
      {screen === 'contacts' && <Contacts onClose={() => setScreen('dashboard')} />}
      {screen === 'search' && <SearchUser onClose={() => setScreen('dashboard')} />}
      {screen === 'create_channel' && (<CreateChannel myID={myID} onClose={() => setScreen('dashboard')} onCreated={(newChannel) => {
      console.log("Channel created successfully:", newChannel);
      setScreen('dashboard');
    }} 
  />
)}
    </div>
  );
}

export default App;