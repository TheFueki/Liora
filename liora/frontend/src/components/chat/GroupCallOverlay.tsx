import React, { useState, useEffect } from 'react';
import { PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import '../../styles/CallOverlay.scss';

interface RemoteParticipant {
  userId: string;
  userName?: string;
  avatarUrl?: string;
  stream: MediaStream;
}

interface GroupCallOverlayProps {
  localStream: MediaStream | null;
  localUserAvatar?: string;
  groupAvatar?: string; // Аватарка самой группы
  remoteParticipants: RemoteParticipant[];
  speakingUsers: Record<string, boolean>;
  onHangUp: () => void;
  groupName: string;
  status: 'dialing' | 'connected' | 'disconnected';
}

export default function GroupCallOverlay({ 
  localStream, 
  localUserAvatar,
  groupAvatar,
  remoteParticipants, 
  speakingUsers,
  onHangUp, 
  groupName, 
  status 
}: GroupCallOverlayProps) {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'connected') {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const totalParticipantsCount = remoteParticipants.length + (localStream ? 1 : 0);

  const getGridClass = (count: number) => {
    if (count <= 1) return 'grid-1';
    if (count === 2) return 'grid-2';
    if (count <= 4) return 'grid-4';
    return 'grid-many';
  };

  return (
    <div className={`call-overlay glass-morphism status-${status}`}>
      <div className="video-container">
        
        {status === 'connected' && totalParticipantsCount > 0 ? (
          <div className={`video-grid ${getGridClass(totalParticipantsCount)}`}>
            
            {localStream && (
              <div className={`video-grid-item local-item ${speakingUsers['You'] ? 'speaking' : ''}`}>
                {localStream.getVideoTracks().length > 0 && !isVideoOff ? (
                  <video
                    autoPlay
                    playsInline
                    muted 
                    ref={(el) => { if (el) el.srcObject = localStream; }}
                    className="participant-video"
                  />
                ) : (
                  <div className="avatar-voice-mode">
                    <div className="user-avatar-circle">
                      {localUserAvatar ? (
                        <img src={localUserAvatar} alt="You" />
                      ) : (
                        <span>YO</span>
                      )}
                    </div>
                  </div>
                )}
                <span className="participant-name">You</span>
              </div>
            )}

            {remoteParticipants.map((p) => {
              const hasVideo = p.stream.getVideoTracks().length > 0 && p.stream.getVideoTracks()[0].enabled;
              const isSpeaking = speakingUsers[p.userId];

              return (
                <div key={p.userId} className={`video-grid-item ${isSpeaking ? 'speaking' : ''}`}>
                  <audio autoPlay ref={(el) => { if (el) el.srcObject = p.stream; }} style={{ display: 'none' }} />
                  
                  {hasVideo ? (
                    <video
                      autoPlay
                      playsInline
                      ref={(el) => { if (el) el.srcObject = p.stream; }}
                      className="participant-video"
                    />
                  ) : (
                    <div className="avatar-voice-mode">
                      <div className="user-avatar-circle">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt={p.userName || p.userId} />
                        ) : (
                          <span className="avatar-placeholder-text">
                            {(p.userName || p.userId).slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <span className="participant-name">{p.userName || p.userId}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="caller-profile animate-fade">
            <div className="avatar-large-wrapper pulsing">
              <div className="avatar-large">
                {groupAvatar ? (
                  <img src={groupAvatar} alt={groupName} />
                ) : (
                  <span className="avatar-placeholder">{groupName?.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
            </div>
            <h2 className="caller-name">{groupName}</h2>
            <p className="call-status">
              {status === 'dialing' ? 'Connecting to Voice Channel...' : formatTime(seconds)}
            </p>
          </div>
        )}

      </div>

      <div className="call-controls">
        <button className={`control-btn ${isMuted ? 'disabled' : ''}`} onClick={toggleMute}>
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        <button className="control-btn hangup" onClick={onHangUp}>
          <PhoneOff size={26} />
        </button>
        <button className={`control-btn ${isVideoOff ? 'disabled' : ''}`} onClick={toggleVideo}>
          {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
        </button>
      </div>
    </div>
  );
}