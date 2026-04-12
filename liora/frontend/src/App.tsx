import { useState } from 'react';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile'; 
import Settings from './pages/Settings';
import Contacts from './pages/Contacts';
import SearchUser from './pages/SearchUser';
import './App.css';

type Screen = 'register' | 'dashboard' | 'profile' | 'settings' | 'contacts' | 'search';

function App() {
  const [screen, setScreen] = useState<Screen>('register');
  const [myID, setMyID] = useState('');

  const handleRegistrationComplete = (id: string) => {
    setMyID(id);
    setScreen('dashboard');
  };

  return (
    <div className="liora-app-container">
      {screen === 'register' && (
        <Register onComplete={handleRegistrationComplete} />
      )}

      {screen === 'dashboard' && (
        <Dashboard 
          myID={myID} 
          setActiveScreen={(s: any) => setScreen(s)} 
        />
      )}

      {screen === 'profile' && (
        <Profile 
          myID={myID} 
          onBack={() => setScreen('dashboard')} 
        />
      )}

      {screen === 'settings' && (
        <Settings 
          onBack={() => setScreen('dashboard')} 
        />
      )}

      {screen === 'contacts' && (
        <Contacts 
          onClose={() => setScreen('dashboard')} 
        />
      )}

      {screen === 'search' && (
        <SearchUser
          onClose={() => setScreen('dashboard')} 
        />
      )}
    </div>
  );
}

export default App;