import { useEffect, useRef, useState } from 'react';

interface RemoteParticipant {
    userId: string;
    stream: MediaStream;
}

export const useGroupWebRTC = (roomId: string, myId: string) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
    const [speakingUsers, setSpeakingUsers] = useState<Record<string, boolean>>({});
    
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analysersRef = useRef<Record<string, { analyser: AnalyserNode, checkId: number }>>({});

    const monitorVoiceActivity = (stream: MediaStream, userId: string) => {
        if (stream.getAudioTracks().length === 0) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContextRef.current;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const isSpeaking = average > 15; // Порог чувствительности

            setSpeakingUsers(prev => {
                if (prev[userId] === isSpeaking) return prev;
                return { ...prev, [userId]: isSpeaking };
            });

            analysersRef.current[userId].checkId = requestAnimationFrame(checkVolume);
        };

        analysersRef.current[userId] = {
            analyser,
            checkId: requestAnimationFrame(checkVolume)
        };
    };

    const startGroupCall = async (isVideo: boolean) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideo,
                audio: true
            });
            setLocalStream(stream);
            monitorVoiceActivity(stream, 'You');

            peerConnectionRef.current = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            stream.getTracks().forEach(track => {
                peerConnectionRef.current?.addTrack(track, stream);
            });

            peerConnectionRef.current.ontrack = (event) => {
                const [remoteStream] = event.streams;
                if (!remoteStream) return;

                const trackId = event.track.id;
                const userId = trackId.split('_')[0] || 'Unknown';

                setRemoteParticipants((prev) => {
                    if (prev.some(p => p.userId === userId)) return prev;
                    
                    monitorVoiceActivity(remoteStream, userId);
                    return [...prev, { userId, stream: remoteStream }];
                });
            };

        } catch (error) {
            console.error("Error starting group call:", error);
        }
    };

    const endGroupCall = () => {
        Object.values(analysersRef.current).forEach(item => cancelAnimationFrame(item.checkId));
        analysersRef.current = {};
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        localStream?.getTracks().forEach(track => track.stop());
        peerConnectionRef.current?.close();
        setLocalStream(null);
        setRemoteParticipants([]);
        setSpeakingUsers({});
    };

    return { startGroupCall, endGroupCall, localStream, remoteParticipants, speakingUsers };
};