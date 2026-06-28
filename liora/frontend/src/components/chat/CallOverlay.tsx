import React, { useState, useEffect } from 'react';
import { PhoneOff, Video, VideoOff, Mic, MicOff, Shield, PhoneCall, CheckCircle } from 'lucide-react';
import '../../styles/CallOverlay.scss';

interface CallOverlayProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onHangUp: () => void;
  username: string;
  avatarUrl?: string;
  status: 'dialing' | 'ringing' | 'connected' | 'disconnected';
}

export default function CallOverlay({ 
  localStream, 
  remoteStream, 
  onHangUp, 
  username, 
  avatarUrl, 
  status 
}: CallOverlayProps) {
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

  const getStatusText = () => {
    switch (status) {
      case 'dialing': return 'Connecting...';
      case 'ringing': return 'Ringing...';
      case 'connected': return 'Call Accepted';
      case 'disconnected': return 'Call Ended';
      default: return '';
    }
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

  const hasLocalVideo = localStream && localStream.getVideoTracks().length > 0 && !isVideoOff;
  const hasRemoteVideo = remoteStream && remoteStream.getVideoTracks().length > 0;
  const showAvatar = status !== 'connected' || !hasRemoteVideo;

  return (
    <div className={`call-overlay glass-morphism status-${status}`}>
      <div className="call-header">
      </div>

      <div className="video-container">
        {hasRemoteVideo && !showAvatar && (
          <video
            autoPlay
            playsInline
            ref={(el) => { if (el) el.srcObject = remoteStream; }}
            className="remote-video"
          />
        )}
        
        {hasLocalVideo && (
          <video
            autoPlay
            playsInline
            muted
            ref={(el) => { if (el) el.srcObject = localStream; }}
            className="local-video"
          />
        )}

        {showAvatar && (
          <div className="caller-profile animate-fade">
            <div className={`avatar-large-wrapper ${status === 'ringing' || status === 'dialing' ? 'pulsing' : ''}`}>
              <div className="avatar-large">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username} />
                ) : (
                  <span className="avatar-placeholder">
                    {username?.slice(0, 2).toUpperCase() || '?'}
                  </span>
                )}
              </div>
              {status === 'connected' && (
                <div className="status-badge-icon accepted animate-scale-up">
                  <CheckCircle size={20} />
                </div>
              )}
              {(status === 'dialing' || status === 'ringing') && (
                <div className="status-badge-icon outgoing">
                  <PhoneCall size={16} />
                </div>
              )}
            </div>
            <h2 className="caller-name">{username}</h2>
            <p className={`call-status ${status === 'connected' ? 'active' : ''}`}>
              {status === 'connected' ? formatTime(seconds) : getStatusText()}
            </p>
          </div>
        )}
      </div>

      <div className="call-controls">
        <button 
          className={`control-btn ${isMuted ? 'disabled' : ''}`} 
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button className="control-btn hangup" onClick={onHangUp} title="End Call">
          <PhoneOff size={26} />
        </button>

        <button 
          className={`control-btn ${isVideoOff || !hasLocalVideo ? 'disabled' : ''}`} 
          onClick={toggleVideo}
          disabled={!localStream?.getVideoTracks().length}
          title="Toggle Video"
        >
          {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
        </button>
      </div>
    </div>
  );
}