import { useActiveCall } from '@stream-io/video-react-bindings';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import { useStreamVideoStoreValue } from '../contexts';
import { generateCallTitle } from '../utils';

export const useCallKeep = () => {
  const activeCall = useActiveCall();
  const activeCallMeta = activeCall?.data.call;
  const activeCallDetails = activeCall?.data.details;
  const callKeepOptions = useStreamVideoStoreValue(
    (store) => store.callKeepOptions,
  );

  useEffect(() => {
    if (callKeepOptions) {
      RNCallKeep.setup(callKeepOptions)
        .then((accepted) => {
          console.log('RNCallKeep initialized');
        })
        .catch((error) => {
          console.log(error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const callTitle = generateCallTitle(
    activeCall?.data.details?.memberUserIds || [],
  );

  const startCall = useCallback(async () => {
    if (Platform.OS === 'ios' && activeCallMeta && activeCallDetails) {
      await RNCallKeep.startCall(
        activeCallMeta.id,
        callTitle,
        activeCallDetails.memberUserIds.join(','),
        'generic',
      );
    }
  }, [activeCallMeta, activeCallDetails, callTitle]);

  const endCall = useCallback(async () => {
    if (Platform.OS === 'ios' && activeCallMeta) {
      await RNCallKeep.endCall(activeCallMeta.id);
    }
  }, [activeCallMeta]);

  return { startCall, endCall };
};
