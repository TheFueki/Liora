import { useState, useEffect } from 'react';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile'; 
import Settings from './pages/Settings';
import Contacts from './pages/Contacts';
import SearchUser from './pages/SearchUser';
import './App.css';

// Импорт функций из Wails
import { GetMyInfo } from '../wailsjs/go/main/App';
import { EventsOn } from '../wailsjs/runtime'; // ИМПОРТИРУЙ ЭТО

type Screen = 'register' | 'dashboard' | 'profile' | 'settings' | 'contacts' | 'search';

function App() {
  const [screen, setScreen] = useState<Screen>('register');
  const [myID, setMyID] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Функция для обновления профиля, которую можно вызвать откуда угодно
  const refreshProfile = () => {
    return GetMyInfo()
      .then((profile) => {
        if (profile && profile.public_id) {
          setMyID(profile.public_id);
          setUserProfile({...profile}); // Делаем копию объекта для ререндера
          return profile;
        }
      })
      .catch(err => console.error("Refresh error:", err));
  };

  useEffect(() => {
    // 1. Авто-логин при старте
    refreshProfile().then((profile) => {
      if (profile && profile.username) {
        setScreen('dashboard');
      } else {
        setScreen('register');
      }
    }).finally(() => setLoading(false));

    // 2. СЛУШАЕМ ОБНОВЛЕНИЯ: Как только в Go сработал EventsEmit, App обновит стейт
    const off = EventsOn("profile_updated", () => {
      console.log("Global signal: profile updated!");
      refreshProfile();
    });

    return () => off(); // Отписка
  }, []);

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
    </div>
  );
}

export default App;