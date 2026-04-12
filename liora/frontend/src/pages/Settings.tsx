import { useState } from 'react';
import { Shield, Bell, Eye, HardDrive, Cpu, Globe, ArrowLeft } from 'lucide-react';
import '../styles/Settings.scss';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const [p2pEnabled, setP2pEnabled] = useState(true);
  const [stealthMode, setStealthMode] = useState(false);

  return (
    <div className="settings-page">
      <div className="noise"></div>
      
      <header className="settings-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <h1>System Settings</h1>
      </header>

      <div className="settings-grid">
        <section className="settings-section glass">
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
              <span className="label">End-to-End Encryption</span>
              <p>Forced Ed25519 for all outgoing nodes</p>
            </div>
            <span className="status-locked">Always On</span>
          </div>
        </section>

        <section className="settings-section glass">
          <div className="section-title">
            <Globe size={18} />
            <h2>Network Layer</h2>
          </div>
          <div className="setting-item">
            <div className="info">
              <span className="label">P2P Discovery</span>
              <p>Allow other nodes to find your identity hash</p>
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

        <section className="settings-section glass">
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
          <button className="danger-btn">Purge All Local Data</button>
        </section>
      </div>
    </div>
  );
}