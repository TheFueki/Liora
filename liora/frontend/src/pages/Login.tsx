import { useState } from 'react';
import '../styles/Auth.scss';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [key, setKey] = useState('');

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        <div className="brand">
          <h1>Welcome Back</h1>
          <p>Enter your private access key</p>
        </div>

        <div className="auth-body">
          <div className="input-group">
            <label>Private Key (Hex/Base64)</label>
            <input 
              type="password" 
              value={key} 
              onChange={(e) => setKey(e.target.value)}
              placeholder="0x..." 
            />
          </div>
          <button className="auth-btn" onClick={onLogin}>
            Unlock Vault
          </button>
          <button className="text-btn">I lost my key</button>
        </div>
      </div>
    </div>
  );
}