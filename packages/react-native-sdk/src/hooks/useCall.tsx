import InCallManager from 'react-native-incall-manager';
import { useCallback } from 'react';
import { useActiveCall } from '@stream-io/video-react-bindings';

export const useCall = () => {
  const activeCall = useActiveCall();

  const hangupCall = useCallback(async () => {
    if (!activeCall) {
      console.warn('Failed to leave call: call is undefined');
      return;
    }
    try {
      activeCall?.leave();
      InCallManager.stop();
    } catch (error) {
      console.warn('failed to leave call', error);
    }
  }, [activeCall]);

  return { hangupCall };
};
