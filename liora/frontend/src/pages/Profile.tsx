import { useState, useEffect, useRef } from 'react';
import { Camera, Check, ShieldCheck, ArrowLeft, RotateCcw } from 'lucide-react';
import '../styles/Profile.scss';
import { UpdateProfile, GetProfile } from '../../wailsjs/go/main/App';
import { supabase } from '../lib/supabaseClient'; 
import { useProfileStore } from '../components/services/profileStore'; 

interface ProfileProps {
  myID: string;
  onBack: () => void;
}

export default function Profile({ myID, onBack }: ProfileProps) {
  const { cachedProfile, setCachedProfile } = useProfileStore();

  const [username, setUsername] = useState(cachedProfile?.username || '');
  const [bio, setBio] = useState(cachedProfile?.bio || '');
  const [avatar, setAvatar] = useState(cachedProfile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${myID}`);
  
  const [isLoading, setIsLoading] = useState(!cachedProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await GetProfile();
        if (data) {
          const freshData = {
            username: data.username || 'Anonymous',
            bio: data.bio || '',
            avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${myID}`
          };

          setUsername(freshData.username);
          setBio(freshData.bio);
          setAvatar(freshData.avatar_url);

          setCachedProfile(freshData);
        }
      } catch (err) {
        console.error("Failed to load profile from Go layer:", err);
        if (!cachedProfile) {
          setUsername('Anonymous');
          setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${myID}`);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [myID, setCachedProfile, cachedProfile]);

  const processAndCompressImage = (file: File, maxDimension = 400, quality = 0.85): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas context identity failure"));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Canvas blob generation failed"));
                return;
              }
              const processedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(processedFile);
            },
            "image/jpeg",
            quality
          );
        };

        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const uploadToSupabase = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${myID}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (error) throw error;

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
      await UpdateProfile(username, bio, avatar);
      
      setCachedProfile({
        username,
        bio,
        avatar_url: avatar
      });

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
      setIsSaving(true);
      try {
        const compressedFile = await processAndCompressImage(file, 500, 0.85);

        const publicUrl = await uploadToSupabase(compressedFile);
        
        if (publicUrl) {
          setAvatar(publicUrl); 
          setHasChanges(true);
        }
      } catch (err) {
        console.error("Image processing pipeline failed:", err);
        alert("Failed to process image safely");
      } finally {
        setIsSaving(false);
      }
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
  <img 
    src={avatar.includes('supabase.co') ? `${avatar}?t=${Date.now()}` : avatar} 
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