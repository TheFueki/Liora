import React, { useState } from 'react';
import { CreateNewChannel } from '../../wailsjs/go/main/App';
import "../styles/CreateChannel.scss";

interface CreateChannelProps {
    myID: string;
    onClose: () => void;
    onCreated: (newChannel: any) => void; 
}

export const CreateChannel: React.FC<CreateChannelProps> = ({ onClose, onCreated, myID }) => {
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false); 

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const createdChannel = await CreateNewChannel(formData);
        
        console.log("Канал успешно создан:", createdChannel);

        const fullChannelData = {
            ...createdChannel,
            owner_id: createdChannel.owner_id || myID, 
            created_at: createdChannel.created_at || new Date().toISOString()
        };

        onCreated(fullChannelData); 
        onClose();
    } catch (err) {
        console.error(err);
    }
};

    return (
        <div className="create-channel-page animate-pop">
            <div className="header">
                <button className="back-button" onClick={onClose} disabled={loading}>← Back</button>
                <h1>Create Channel</h1>
            </div>
            
            <form onSubmit={handleSubmit} className="create-form">
                <div className="input-group">
                    <label>Channel Name</label>
                    <input 
                        required
                        className="custom-input"
                        placeholder="e.g. My Awesome Channel" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>

                <div className="input-group">
                    <label>Description</label>
                    <textarea 
                        className="custom-textarea"
                        placeholder="What is this channel about?" 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <button type="submit" className="submit-button">
                    Create Channel
                </button>
            </form>
        </div>
    );
};

export default CreateChannel;