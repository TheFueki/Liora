import { useState } from 'react';
import { LogIn, Shield, Loader2, AlertCircle } from 'lucide-react';
// @ts-ignore
import { GetMyID } from '../../wailsjs/go/main/App';
import '../styles/Auth.scss';

interface LoginProps {
  onLogin: (id: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const id = await GetMyID();
      
      const isNullId = /^0+$/.test(id);
      
      if (id && id.length >= 64 && !isNullId) {
        setTimeout(() => {
          onLogin(id);
        }, 800);
      } else {
        console.error("Invalid ID detected:", id);
        setError("IDENTITY_NOT_FOUND_OR_CORRUPT");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Unlock failed:", err);
      setError("VAULT_LOCKED_OR_CORRUPT");
      setIsLoading(false);
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
          <h1 className="glitch" data-text="WELCOME">Welcome</h1>
          <p className="subtitle">Secure Identity Vault</p>
        </div>

        <div className="auth-body">
          {error && (
            <div className="error-notice">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="processing">
              <Loader2 className="spin" size={40} />
              <p className="status-text">DECRYPTING_VAULT...</p>
            </div>
          ) : (
            <div className="login-screen">
              <div className="status-box found">
                <p className="status-title">LOCAL_NODE_READY</p>
                <p className="status-desc">Identity detected in your local storage.</p>
              </div>

              <button className="auth-btn pulse" onClick={handleUnlock}>
                <LogIn size={18} />
                Unlock & Enter
              </button>

              <button className="text-btn" onClick={() => window.location.reload()}>
                Switch or Reset Identity
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}