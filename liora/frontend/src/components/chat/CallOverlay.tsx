import React from 'react';
import { PhoneOff } from 'lucide-react';
import  '../../styles/CallOverlay.scss';

interface CallOverlayProps {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    onHangUp: () => void;
}

export default function CallOverlay({ localStream, remoteStream, onHangUp }: CallOverlayProps) {
    return (
    <div className="call-overlay glass-morphism">
      <div className="video-container">
        {remoteStream && (
          <video
            autoPlay
            playsInline
            ref={(el) => { if (el) el.srcObject = remoteStream; }}
            className="remote-video"
          />
        )}
        {localStream && (
          <video
            autoPlay
            playsInline
            muted
            ref={(el) => { if (el) el.srcObject = localStream; }}
            className="local-video"
          />
        )}
      </div>
      <div className="call-controls">
        <button className="control-btn hangup" onClick={onHangUp}>
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}