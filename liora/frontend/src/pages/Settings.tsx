import { useState } from 'react';
import { 
  Shield, 
  HardDrive, 
  Globe, 
  Wallet, 
  Fingerprint, 
  X, 
  Zap, 
  Lock,
  Settings as SettingsIcon,
  Bell,
  User,
  Database
} from 'lucide-react';
import '../styles/Settings.scss';

interface SettingsProps {
  onBack: () => void;
}

type SettingsTab = 'general' | 'security' | 'network' | 'vault' | 'web3';

export default function Settings({ onBack }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [p2pEnabled, setP2pEnabled] = useState(true);
  const [stealthMode, setStealthMode] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  const handleWalletConnect = () => {
    setIsConnectingWallet(true);
    setTimeout(() => setIsConnectingWallet(false), 1500);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <section className="settings-section animate-in">
            <div className="section-title">
              <SettingsIcon size={18} />
              <h2>General Preferences</h2>
            </div>
            <div className="setting-item">
              <div className="info">
                <span className="label">Interface Language</span>
                <p>System-wide display language</p>
              </div>
              <select className="dark-select">
                <option>English (US)</option>
                <option>Russian (RU)</option>
                <option>French (FR)</option>
              </select>
            </div>
            <div className="setting-item">
              <div className="info">
                <span className="label">Notifications</span>
                <p>Show desktop alerts for new messages</p>
              </div>
              <input type="checkbox" defaultChecked />
            </div>
          </section>
        );

      case 'security':
        return (
          <section className="settings-section animate-in">
            <div className="section-title">
              <Shield size={18} />
              <h2>Security & Privacy</h2>
            </div>
            <div className="setting-item">
              <div className="info">
                <span className="label">Stealth Mode</span>
                <p>Hide your online status from everyone</p>
              </div>
              <input 
                type="checkbox" 
                checked={stealthMode} 
                onChange={(e) => setStealthMode(e.target.checked)} 
              />
            </div>
            <div className="setting-item">
              <div className="info">
                <span className="label">Quantum-Safe Handshake</span>
                <p>Enable Kyber-768 experimental layer</p>
              </div>
              <div className="toggle-disabled">Dev Only</div>
            </div>
            <div className="setting-item">
              <div className="info">
                <span className="label">End-to-End Encryption</span>
                <p>Forced Ed25519 for all nodes</p>
              </div>
              <span className="status-locked">Always On</span>
            </div>
          </section>
        );

      case 'network':
        return (
          <section className="settings-section animate-in">
            <div className="section-title">
              <Globe size={18} />
              <h2>Network Layer</h2>
            </div>
            <div className="setting-item">
              <div className="info">
                <span className="label">P2P Discovery</span>
                <p>Allow other nodes to find your hash</p>
              </div>
              <input 
                type="checkbox" 
                checked={p2pEnabled} 
                onChange={(e) => setP2pEnabled(e.target.checked)} 
              />
            </div>
            <div className="setting-item">
              <div className="info">
                <span className="label">Relay Servers</span>
                <p>Use Liora relays if direct P2P fails</p>
              </div>
              <select className="dark-select">
                <option>EU-Frankfurt (Primary)</option>
                <option>US-East (Latency: 120ms)</option>
              </select>
            </div>
          </section>
        );

      case 'web3':
        return (
          <section className="settings-section animate-in">
            <div className="section-title highlight">
              <Wallet size={18} />
              <h2>Web3 Identity</h2>
            </div>
            <div className="setting-item">
              <div className="info">
                <span className="label">Crypto Wallet OAuth</span>
                <p>Link Ethereum/Solana wallet for signing</p>
              </div>
              <button 
                className={`wallet-btn ${isConnectingWallet ? 'loading' : ''}`} 
                onClick={handleWalletConnect}
              >
                {isConnectingWallet ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
            <div className="setting-item">
              <div className="info">
                <span className="label">Biometric Verification</span>
                <p>Unlock vault with Windows Hello / TouchID</p>
              </div>
              <Fingerprint size={18} className="text-dim" />
            </div>
          </section>
        );

      case 'vault':
        return (
          <section className="settings-section animate-in">
            <div className="section-title">
              <HardDrive size={18} />
              <h2>Local Vault</h2>
            </div>
            <div className="vault-info">
              <div className="storage-bar">
                <div className="usage" style={{ width: '15%' }}></div>
              </div>
              <p>Vault Size: 1.2 MB / 500 MB</p>
            </div>
            <div className="action-row">
              <button className="secondary-btn">Export Backup</button>
              <button className="danger-btn">Purge All Data</button>
            </div>
          </section>
        );
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onBack}>
      <div className="settings-modal glass-morphism animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="noise"></div>
        
        <aside className="settings-sidebar">
          <div className="sidebar-header">
            <SettingsIcon size={24} className="logo-icon" />
             <span>Liora</span>
          </div>
          
          <nav className="sidebar-nav">
            <button className={activeTab === 'general' ? 'active' : ''} onClick={() => setActiveTab('general')}>
              <SettingsIcon size={18} /> General
            </button>
            <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>
              <Lock size={18} /> Security
            </button>
            <button className={activeTab === 'network' ? 'active' : ''} onClick={() => setActiveTab('network')}>
              <Globe size={18} /> Network
            </button>
            <button className={activeTab === 'web3' ? 'active' : ''} onClick={() => setActiveTab('web3')}>
              <Wallet size={18} /> Web3 Auth
            </button>
            <button className={activeTab === 'vault' ? 'active' : ''} onClick={() => setActiveTab('vault')}>
              <Database size={18} /> Storage
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="node-version">v.0.4.2-beta</div>
          </div>
        </aside>

        <main className="settings-main">
          <header className="main-header">
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <button className="close-btn" onClick={onBack}><X size={20} /></button>
          </header>
          
          <div className="main-content">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}