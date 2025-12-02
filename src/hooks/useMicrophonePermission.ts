import { useState, useEffect } from 'react';

type PermissionState = 'checking' | 'granted' | 'denied' | 'prompt';

// Helper to check if mediaDevices is available
const hasMediaDevices = (): boolean => {
  return !!(window.navigator && window.navigator.mediaDevices && window.navigator.mediaDevices.getUserMedia);
};

export const useMicrophonePermission = () => {
  const [permissionState, setPermissionState] = useState<PermissionState>('checking');
  const [hasGrantedBefore, setHasGrantedBefore] = useState(false);

  useEffect(() => {
    // Check localStorage for previous grant
    const previouslyGranted = localStorage.getItem('microphone_permission_granted') === 'true';
    setHasGrantedBefore(previouslyGranted);

    const checkPermission = async () => {
      try {
        // Check if Permissions API is supported
        if ('permissions' in window.navigator && window.navigator.permissions) {
          const result = await window.navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionState(result.state as PermissionState);

          // Listen for permission changes
          result.onchange = () => {
            setPermissionState(result.state as PermissionState);
            if (result.state === 'granted') {
              localStorage.setItem('microphone_permission_granted', 'true');
              localStorage.setItem('microphone_permission_timestamp', Date.now().toString());
            }
          };
        } else if (hasMediaDevices()) {
          // Fallback: try to enumerate devices to infer permission
          try {
            const devices = await window.navigator.mediaDevices!.enumerateDevices();
            const hasMicLabel = devices.some(device => device.kind === 'audioinput' && device.label !== '');
            setPermissionState(hasMicLabel ? 'granted' : 'prompt');
          } catch {
            setPermissionState('prompt');
          }
        } else {
          setPermissionState('prompt');
        }
      } catch (error) {
        console.error('Error checking microphone permission:', error);
        setPermissionState('prompt');
      }
    };

    checkPermission();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!hasMediaDevices()) {
        console.error('getUserMedia not supported');
        return false;
      }

      const stream = await window.navigator.mediaDevices!.getUserMedia({ audio: true });
      // Stop all tracks immediately - we just needed to trigger the permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState('granted');
      localStorage.setItem('microphone_permission_granted', 'true');
      localStorage.setItem('microphone_permission_timestamp', Date.now().toString());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermissionState('denied');
      return false;
    }
  };

  return {
    permissionState,
    hasGrantedBefore,
    requestPermission,
    isReady: permissionState === 'granted',
  };
};
