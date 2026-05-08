import { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  ArrowLeft, 
  Loader2, 
  RefreshCw, 
  LogIn, 
  Database, 
  User 
} from 'lucide-react';
// @ts-ignore
import { 
  GetMyID, 
  CreateNewIdentity, 
  ImportKey, 
  GetAvailableAccounts, 
  SwitchToAccount 
} from '../../wailsjs/go/main/App';
import '../styles/Auth.scss';

interface RegisterProps {
  onComplete: (id: string) => void;
}

type AuthMode = 'choice' | 'register' | 'login' | 'loading' | 'select';

interface Account {
  id: string;
  username: string;
  avatarUrl: string;
}

export default function Register({ onComplete }: RegisterProps) {
  const [mode, setMode] = useState<AuthMode>('choice');
  const [importKey, setImportKey] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkExistingIdentity = async () => {
    try {
      const id = await GetMyID();
      if (id && id.length >= 64 && !/^0+$/.test(id)) {
        setHasStoredKey(true);
      } else {
        setHasStoredKey(false);
      }
    } catch (err) {
      setHasStoredKey(false);
    }
  };

  useEffect(() => {
    checkExistingIdentity();
  }, [mode]);

  const handleUseExisting = async () => {
    setMode('loading');
    setError(null);
    try {
      const list = await GetAvailableAccounts();
      if (list && list.length > 0) {
        setAccounts(list);
        setMode('select');
      } else {
        const id = await GetMyID();
        if (id && id.length >= 64) {
          onComplete(id);
        } else {
          setMode('register');
        }
      }
    } catch (err) {
      console.error(err);
      setError("FAILED_TO_LOAD_ACCOUNTS");
      setMode('register');
    }
  };

  const handleSelectAccount = async (id: string) => {
    setMode('loading');
    try {
      await SwitchToAccount(id);
      onComplete(id);
    } catch (err) {
      setError("SWITCH_FAILED");
      setMode('select');
    }
  };

  const handleCreateNew = async () => {
    if (hasStoredKey) {
      const confirm = window.confirm(
        "Create a new identity? Your current key will be saved in the manager."
      );
      if (!confirm) return;
    }

    setMode('loading');
    setError(null);
    try {
      const id = await CreateNewIdentity();
      if (id) {
        setTimeout(() => onComplete(id), 1000);
      }
    } catch (err) {
      setError("GENERATE_FAILED");
      setMode('choice');
    }
  };

  const handleImport = async () => {
    const cleanKey = importKey.trim().toLowerCase();
    if (cleanKey.length !== 128) {
      setError("INVALID_FORMAT: Private Key must be 128 characters.");
      return;
    }

    setMode('loading');
    setError(null);
    try {
      const id = await ImportKey(cleanKey);
      if (id) {
        onComplete(id);
      }
    } catch (err) {
      setError("IMPORT_FAILED");
      setMode('login');
    }
  };

  return (
    <div className="auth-page">
      <div className="noise"></div>
      <div className="auth-card glass-morphism animate-in">
        
        <div className="brand">
          <div className="logo-glitch">
            <Shield size={42} className="shield-icon" />
          </div>
          <h1 className="glitch" data-text="LIORA">Liora</h1>
          <p className="subtitle">Strictly Anonymous Messaging</p>
        </div>

        <div className="auth-body">
          {error && <div className="error-notice">{error}</div>}

          {mode === 'choice' && (
            <div className="choice-screen animate-in">
              <button className="auth-btn pulse" onClick={() => setMode('register')}>
                <Database size={18} />
                Identity Manager
              </button>
              <div className="divider"><span>OR</span></div>
              <button className="auth-btn secondary" onClick={() => setMode('login')}>
                <Key size={18} />
                Import Hex-Key
              </button>
            </div>
          )}

          {mode === 'register' && (
            <div className="register-screen animate-in">
              <div className="status-container">
                <div className={`status-box ${hasStoredKey ? 'found' : 'none'}`}>
                  <p className="status-title">
                    {hasStoredKey ? 'IDENTITY_DETECTED' : 'CLEAN_NODE'}
                  </p>
                  <p className="status-desc">
                    {hasStoredKey ? 'Vault is active.' : 'No identity found on this machine.'}
                  </p>
                </div>
              </div>

              <div className="action-stack">
                {hasStoredKey && (
                  <button className="auth-btn pulse" onClick={handleUseExisting}>
                    <LogIn size={18} />
                    Login with Existing
                  </button>
                )}
                <button 
                  className={`auth-btn ${hasStoredKey ? 'secondary' : ''}`} 
                  onClick={handleCreateNew}
                >
                  <RefreshCw size={18} />
                  {hasStoredKey ? "Generate New Identity" : "Initialize Identity"}
                </button>
              </div>

              <button className="back-link" onClick={() => setMode('choice')}>
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          )}

          {mode === 'select' && (
            <div className="select-screen animate-in">
              <p className="select-label">Select Identity to Unlock:</p>
              <div className="account-list">
                {accounts.map((acc) => (
                  <div 
                    key={acc.id} 
                    className="account-item glass-morphism" 
                    onClick={() => handleSelectAccount(acc.id)}
                  >
                    <div className="account-avatar">
                      {acc.avatarUrl ? (
                        <img src={acc.avatarUrl} alt="Avatar" className="avatar-img" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div className="account-info">
                      <p className="acc-name">{acc.username}</p>
                      <p className="acc-id">{acc.id.substring(0, 12)}...</p>
                    </div>
                    <LogIn size={16} className="enter-icon" />
                  </div>
                ))}
              </div>
              <button className="back-link" onClick={() => setMode('register')}>
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          )}

          {mode === 'login' && (
            <div className="login-screen animate-in">
              <div className="input-group">
                <label className="input-label">Private Hex-Key (128 chars)</label>
                <textarea 
                  className="key-input"
                  value={importKey}
                  onChange={(e) => {setImportKey(e.target.value); setError(null);}}
                  placeholder="Paste your 128-character private key..."
                  spellCheck={false}
                />
              </div>
              <button className="auth-btn" onClick={handleImport}>Restore Access</button>
              <button className="back-link" onClick={() => setMode('choice')}>
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          )}

          {mode === 'loading' && (
            <div className="processing">
              <div className="orbit-spinner">
                <Loader2 className="spin" size={40} />
              </div>
              <p className="status-text">HANDSHAKE</p>
              <span className="sub-status">Finalizing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}