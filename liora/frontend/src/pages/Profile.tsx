import { useState, useEffect, useRef } from 'react';
import { Camera, Check, ShieldCheck, ArrowLeft, RotateCcw } from 'lucide-react';
import '../styles/Profile.scss';
import { UpdateProfile, GetProfile } from '../../wailsjs/go/main/App';
import { supabase } from '../lib/supabaseClient'; 

interface ProfileProps {
  myID: string;
  onBack: () => void;
}

export default function Profile({ myID, onBack }: ProfileProps) {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await GetProfile();
        if (data) {
          setUsername(data.username || 'Anonymous');
          setBio(data.bio || '');
          setAvatar(data.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${myID}`);
        }
      } catch (err) {
        setUsername('Anonymous');
        setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${myID}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [myID]);

  // ФУНКЦИЯ ЗАГРУЗКИ ФАЙЛА В STORAGE
  const uploadToSupabase = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${myID}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Загружаем в бакет 'avatars'
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (error) throw error;

      // Получаем публичную ссылку
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image to server');
      return null;
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      // Сохраняем в БД уже готовую ссылку (которая лежит в стейте avatar)
      await UpdateProfile(username, bio, avatar);
      setHasChanges(false);
    } catch (err) {
      console.error("Protocol Sync Failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("File too large. Limit is 3MB.");
        return;
      }

      setIsSaving(true); // Показываем загрузку, пока файл летит в облако
      const publicUrl = await uploadToSupabase(file);
      
      if (publicUrl) {
        setAvatar(publicUrl); // В стейт летит URL, а не Base64
        setHasChanges(true);
      }
      setIsSaving(false);
    }
  };

  const resetAvatar = () => {
    setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${Math.random()}`);
    setHasChanges(true);
  };

  if (isLoading) return <div className="profile-loader-overlay"><div className="scanner-line"></div></div>;

  return (
    <div className="profile-page">
      <div className="noise"></div>
      
      <header className="profile-nav">
        <button className="back-btn-circle" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="security-tag">
          <ShieldCheck size={14} />
          <span>Liora E2EE Active</span>
        </div>
      </header>

      <div className="profile-container glass-morphism">
        <div className="avatar-master-section">
          <div className={`avatar-frame ${isSaving ? 'syncing' : ''}`}>
            {/* Теперь здесь всегда URL, никакой ошибки INVALID_URL */}
            <img 
              src={avatar} 
              alt="Identity" 
              onError={(e) => (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${myID}`}
            />
            <div className="avatar-overlay">
              <button onClick={() => fileInputRef.current?.click()} className="action-btn" disabled={isSaving}>
                <Camera size={18} />
              </button>
              <button onClick={resetAvatar} className="action-btn" disabled={isSaving}>
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
        </div>

        <div className="identity-card">
          <div className="input-group-modern">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => { setUsername(e.target.value); setHasChanges(true); }}
              spellCheck={false}
            />
          </div>

          <div className="input-group-modern">
            <label>Bio</label>
            <textarea 
              value={bio} 
              onChange={(e) => { setBio(e.target.value); setHasChanges(true); }}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="hash-info">
            <label>Public Identity Hash</label>
            <div className="id-strip">
              <code>{myID}</code>
            </div>
          </div>
        </div>

        <footer className="action-footer">
          <button 
            className={`protocol-btn ${hasChanges ? 'ready' : ''} ${isSaving ? 'executing' : ''}`} 
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <span className="flex-center"><div className="spinner"></div> Processing...</span>
            ) : hasChanges ? (
              <span className="flex-center"><Check size={18} /> Commit Changes</span>
            ) : (
              "Up to date"
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}