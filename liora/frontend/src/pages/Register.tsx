import { useState, useEffect } from 'react';
import { Shield, Key, ArrowLeft, Loader2, RefreshCw, LogIn } from 'lucide-react';
// @ts-ignore
import { GetMyID, CreateNewIdentity, ImportKey } from '../../wailsjs/go/main/App';
import '../styles/Auth.scss';

interface RegisterProps {
  onComplete: (id: string) => void;
}

type AuthMode = 'choice' | 'register' | 'login' | 'loading';

export default function Register({ onComplete }: RegisterProps) {
  const [mode, setMode] = useState<AuthMode>('choice');
  const [importKey, setImportKey] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'register') {
      const checkKey = async () => {
        try {
          const id = await GetMyID();
          if (id && id.length === 64) {
            setHasStoredKey(true);
          }
        } catch (err) {
          setHasStoredKey(false);
        }
      };
      checkKey();
    }
  }, [mode]);

  const handleUseExisting = async () => {
    setMode('loading');
    try {
      const id = await GetMyID();
      onComplete(id);
    } catch (err) {
      setError("FAILED_TO_LOAD_EXISTING_IDENTITY");
      setMode('choice');
    }
  };

  const handleCreateNew = async () => {
    if (hasStoredKey) {
      const confirmDelete = window.confirm(
        "WARNING: An existing identity was found. Generating a new one will permanently DELETE your current key. Continue?"
      );
      if (!confirmDelete) return;
    }

    setMode('loading');
    setError(null);
    try {
      const id = await CreateNewIdentity();
      if (id) {
        setTimeout(() => onComplete(id), 1500);
      }
    } catch (err) {
      console.error(err);
      setError("GENERATE_FAILED");
      setMode('choice');
    }
  };

  const handleImport = async () => {
    const cleanKey = importKey.trim().toLowerCase();
    const isHex = /^[0-9a-f]{64}$/.test(cleanKey);

    if (!isHex) {
      setError("INVALID_HEX_ID: Identity must be a 64-char hex string.");
      return;
    }

    setMode('loading');
    try {
      const id = await ImportKey(cleanKey);
      if (id) onComplete(id);
    } catch (err) {
      setError("IMPORT_FAILED");
      setMode('login');
    }
  };

  return (
    <div className="auth-page">
      <div className="noise"></div>
      <div className="auth-card glass-morphism">
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
                <Key size={18} />
                Generate Identity
              </button>
              <div className="divider"><span>OR</span></div>
              <button className="auth-btn secondary" onClick={() => setMode('login')}>
                Import Hex-Key
              </button>
            </div>
          )}

          {mode === 'register' && (
            <div className="register-screen animate-in">
              <div className="manifesto">
                {hasStoredKey ? (
                  <div className="status-box found">
                    <p className="status-title">IDENTITY_DETECTED</p>
                    <p className="status-desc">Local key file is already initialized on this node.</p>
                  </div>
                ) : (
                  <div className="status-box none">
                    <p className="status-title">CLEAN_NODE</p>
                    <p className="status-desc">No identity found. System ready for handshake.</p>
                  </div>
                )}
              </div>

              <div className="action-stack">
                {hasStoredKey && (
                  <button className="auth-btn pulse" onClick={handleUseExisting}>
                    <LogIn size={18} />
                    Login with Existing
                  </button>
                )}
                
                <button className={`auth-btn ${hasStoredKey ? 'secondary' : ''}`} onClick={handleCreateNew}>
                  <RefreshCw size={18} className={!hasStoredKey ? 'hidden' : ''} />
                  {hasStoredKey ? "Overwrite & Create New" : "Initialize New Identity"}
                </button>
              </div>

              <button className="back-link" onClick={() => setMode('choice')}>
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          )}

          {mode === 'login' && (
            <div className="login-screen animate-in">
              <p className="input-label">Private Hex-Key</p>
              <textarea 
                className="key-input"
                value={importKey}
                onChange={(e) => {setImportKey(e.target.value); setError(null);}}
                placeholder="64-character hex sequence..."
                spellCheck={false}
              />
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
              <p className="status-text">CRYPTOGRAPHIC_HANDSHAKE</p>
              <span className="sub-status">Syncing local key with protocol layer...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}