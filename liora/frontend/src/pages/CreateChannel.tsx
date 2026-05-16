import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CreateNewChannel } from '../../wailsjs/go/main/App';
import { Hash, Camera, Loader2 } from 'lucide-react';
import "../styles/CreateChannel.scss";

interface CreateChannelProps {
    myID: string;
    onClose: () => void;
    onCreated: (newChannel: any) => void; 
}

export const CreateChannel: React.FC<CreateChannelProps> = ({ onClose, onCreated, myID }) => {
    const [formData, setFormData] = useState({ name: '', username: '', description: '' });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false); 
    const [errorText, setErrorText] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUsernameChange = (val: string) => {
        let clean = val.replace('@', '').toLowerCase().replace(/\s+/g, '');
        setFormData({ ...formData, username: clean });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const uploadAvatar = async (channelUsername: string): Promise<string | null> => {
        if (!avatarFile) return null;

        try {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `channel_avatars/${channelUsername}_${Date.now()}.${fileExt}`;

            const { error } = await supabase.storage
                .from('avatars')
                .upload(fileName, avatarFile, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            return publicUrlData.publicUrl;
        } catch (uploadErr: any) {
            console.error("Ошибка загрузки аватарки:", uploadErr);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorText(null);

        const finalUsername = formData.username.trim();

        if (finalUsername.length < 3 || finalUsername.length > 32) {
            setErrorText("Юзернейм должен быть от 3 до 32 символов.");
            return;
        }
        const usernameRegex = /^[a-z0-9_]+$/;
        if (!usernameRegex.test(finalUsername)) {
            setErrorText("Юзернейм может содержать только латинские буквы, цифры и знак подчеркивания (_).");
            return;
        }

        setLoading(true);
        try {
            let uploadedAvatarUrl = null;
            if (avatarFile) {
                uploadedAvatarUrl = await uploadAvatar(finalUsername);
            }

            const payload = {
                name: formData.name.trim(),
                username: finalUsername,
                description: formData.description.trim(),
                avatar_url: uploadedAvatarUrl ?? ""
            };

            const createdChannel = await CreateNewChannel(payload);
            console.log("Channel is created successfully:", createdChannel);

            const fullChannelData = {
                ...createdChannel,
                username: finalUsername, 
                avatar_url: uploadedAvatarUrl,
                owner_id: createdChannel.owner_id || myID, 
                created_at: createdChannel.created_at || new Date().toISOString()
            };

            onCreated(fullChannelData); 
            onClose();
        } catch (err: any) {
            console.error("Error while creating a channel:", err);
            if (err?.toString().includes("is taken")) {
                setErrorText("This channel username is already taken.");
            } else {
                setErrorText(err?.toString() || "Channel is not able to create.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-channel-page animate-pop">
            <div className="header">
                <button type="button" className="back-button" onClick={onClose} disabled={loading}>← Back</button>
                <h1>Create Channel</h1>
            </div>
            
            <form onSubmit={handleSubmit} className="create-form" autoComplete="off">
                {errorText && <div className="error-banner">{errorText}</div>}

                <div className="avatar-select-section">
                    <div 
                        className="avatar-upload-preview" 
                        onClick={() => !loading && fileInputRef.current?.click()}
                        style={{ backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none' }}
                    >
                        {!avatarPreview && <Hash size={40} className="default-hash-icon" />}
                        <div className="upload-overlay">
                            <Camera size={20} />
                        </div>
                    </div>
                    <input 
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <label className="avatar-label">Channel Avatar</label>
                </div>

                <div className="input-group">
                    <label>Channel Name</label>
                    <input 
                        required
                        disabled={loading}
                        name="liora-channel-display-name"
                        autoComplete="off"
                        className="custom-input"
                        placeholder="e.g. My Awesome Channel" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>

                <div className="input-group">
                    <label>Channel Username</label>
                    <div className="username-input-wrapper">
                        <span className="username-prefix">@</span>
                        <input 
                            required
                            disabled={loading}
                            maxLength={32}
                            name="liora-channel-unique-username"
                            autoComplete="new-password" 
                            className="custom-input username-input"
                            placeholder="liora_channel" 
                            value={formData.username}
                            onChange={e => handleUsernameChange(e.target.value)}
                        />
                    </div>
                    <small className="input-hint">Only Latin, numbers and underscores (3-32 symbols).</small>
                </div>

                <div className="input-group">
                    <label>Description</label>
                    <textarea 
                        disabled={loading}
                        name="liora-channel-description"
                        className="custom-textarea"
                        placeholder="What is this channel about?" 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 size={16} className="spinner-icon" />
                            Creating...
                        </>
                    ) : "Create Channel"}
                </button>
            </form>
        </div>
    );
};

export default CreateChannel;