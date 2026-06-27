import { useEffect, useRef, useState} from 'react';

export const useWebRTC = (chatId: string, myId: string) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    const startCall = async (isVideo: boolean) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideo,
                audio: true
            });
            setLocalStream(stream);
            peerConnectionRef.current = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            stream.getTracks().forEach(track => {
                peerConnectionRef.current?.addTrack(track, stream);
            });

            peerConnectionRef.current.ontrack = (event) => {
             if (event.streams && event.streams[0]) {
                 setRemoteStream(event.streams[0]);
             }
            };
        } catch (error) {
            console.error("Error starting call:", error);
        }
    };

    const endCall = () => {
        localStream?.getTracks().forEach(track => track.stop());
        peerConnectionRef.current?.close();
        setLocalStream(null);
        setRemoteStream(null);
    };

    return { startCall, endCall, localStream, remoteStream };
};