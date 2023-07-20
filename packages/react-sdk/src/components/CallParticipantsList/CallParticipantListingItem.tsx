import clsx from 'clsx';
import {
  ComponentProps,
  ComponentType,
  forwardRef,
  useEffect,
  useState,
} from 'react';
import {
  Restricted,
  useCall,
  useConnectedUser,
} from '@stream-io/video-react-bindings';
import {
  OwnCapability,
  SfuModels,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { AudioOutputLevelSlider } from '../CallControls';
import { IconButton } from '../Button';
import {
  GenericMenu,
  GenericMenuButtonItem,
  MenuToggle,
  ToggleMenuButtonProps,
} from '../Menu';
import { WithTooltip } from '../Tooltip';
import { Icon } from '../Icon';
import { useMediaDevices } from '../../core';

type CallParticipantListingItemProps = {
  /** Participant object be rendered */
  participant: StreamVideoParticipant;
  /** Custom component used to display participant's name */
  DisplayName?: ComponentType<{ participant: StreamVideoParticipant }>;
};
export const CallParticipantListingItem = ({
  participant,
  DisplayName = DefaultDisplayName,
}: CallParticipantListingItemProps) => {
  const isAudioOn = participant.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoOn = participant.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );
  const isPinned = !!participant.pinnedAt;

  return (
    <div className="str-video__participant-listing-item">
      <DisplayName participant={participant} />
      <div className="str-video__participant-listing-item__media-indicator-group">
        <MediaIndicator
          title={isAudioOn ? 'Microphone on' : 'Microphone off'}
          className={clsx(
            'str-video__participant-listing-item__icon',
            `str-video__participant-listing-item__icon-${
              isAudioOn ? 'mic' : 'mic-off'
            }`,
          )}
        />
        <MediaIndicator
          title={isVideoOn ? 'Camera on' : 'Camera off'}
          className={clsx(
            'str-video__participant-listing-item__icon',
            `str-video__participant-listing-item__icon-${
              isVideoOn ? 'camera' : 'camera-off'
            }`,
          )}
        />
        {isPinned && (
          <MediaIndicator
            title={'Pinned'}
            className={clsx(
              'str-video__participant-listing-item__icon',
              'str-video__participant-listing-item__icon-pinned',
            )}
          />
        )}

        <MenuToggle placement="bottom-end" ToggleButton={ToggleButton}>
          <ParticipantActionsContextMenu participant={participant} />
        </MenuToggle>
      </div>
    </div>
  );
};

const MediaIndicator = (props: ComponentProps<'div'>) => (
  <WithTooltip {...props} />
);

type DisplayNameProps = {
  /** Participant object that provides the data from which display name can be generated */
  participant: StreamVideoParticipant;
};
// todo: implement display device flag
const DefaultDisplayName = ({ participant }: DisplayNameProps) => {
  const connectedUser = useConnectedUser();

  const meFlag = participant.userId === connectedUser?.id ? 'Me' : '';
  const nameOrId = participant.name || participant.userId || 'Unknown';
  let displayName;
  if (!participant.name) {
    displayName = meFlag || nameOrId || 'Unknown';
  } else if (meFlag) {
    displayName = `${nameOrId} (${meFlag})`;
  } else {
    displayName = nameOrId;
  }

  return (
    <WithTooltip
      className="str-video__participant-listing-item__display-name"
      title={displayName}
    >
      {displayName}
    </WithTooltip>
  );
};

const ToggleButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  (props, ref) => {
    return <IconButton enabled={props.menuShown} icon="ellipsis" ref={ref} />;
  },
);

export const ParticipantActionsContextMenu = ({
  participant,
  participantViewElement,
  videoElement,
}: {
  participant: StreamVideoParticipant;
  participantViewElement?: HTMLDivElement | null;
  videoElement?: HTMLVideoElement | null;
}) => {
  const [fullscreenModeOn, setFullscreenModeOn] = useState(
    !!document.fullscreenElement,
  );
  const [pictureInPictureElement, setPictureInPictureElement] = useState(
    document.pictureInPictureElement,
  );
  const activeCall = useCall();
  const { isAudioOutputChangeSupported } = useMediaDevices();

  const blockUser = () => {
    activeCall?.blockUser(participant.userId);
  };

  // FIXME: soft kicking does not work this way
  // also needs to be session-based
  // const kickUserClickHandler = () => {
  //   getCall()?.updateCallMembers({
  //     remove_members: [participant.userId],
  //     disconnectRemovedMembers: true,
  //   });
  // };

  const muteAudio = () => {
    activeCall?.muteUser(participant.userId, 'audio');
  };
  const muteVideo = () => {
    activeCall?.muteUser(participant.userId, 'video');
  };
  const muteScreenShare = () => {
    activeCall?.muteUser(participant.userId, 'screenshare');
  };

  const grantPermission = (permission: string) => () => {
    activeCall?.updateUserPermissions({
      user_id: participant.userId,
      grant_permissions: [permission],
    });
  };

  const revokePermission = (permission: string) => () => {
    activeCall?.updateUserPermissions({
      user_id: participant.userId,
      revoke_permissions: [permission],
    });
  };

  const toggleParticipantPinnedAt = () => {
    activeCall?.setParticipantPinnedAt(
      participant.sessionId,
      participant.pinnedAt ? undefined : Date.now(),
    );
  };

  const toggleFullscreenMode = () => {
    if (!fullscreenModeOn)
      return participantViewElement
        ?.requestFullscreen()
        .then(() => setFullscreenModeOn(true))
        .catch(console.error);

    document
      .exitFullscreen()
      .catch(console.error)
      .finally(() => setFullscreenModeOn(false));
  };

  useEffect(() => {
    if (!videoElement) return;

    const handlePictureInPicture = () => {
      setPictureInPictureElement(document.pictureInPictureElement);
    };

    videoElement.addEventListener(
      'enterpictureinpicture',
      handlePictureInPicture,
    );
    videoElement.addEventListener(
      'leavepictureinpicture',
      handlePictureInPicture,
    );

    return () => {
      videoElement.removeEventListener(
        'enterpictureinpicture',
        handlePictureInPicture,
      );
      videoElement.removeEventListener(
        'leavepictureinpicture',
        handlePictureInPicture,
      );
    };
  }, [videoElement]);

  const togglePictureInPicture = () => {
    if (videoElement && pictureInPictureElement !== videoElement)
      return videoElement
        .requestPictureInPicture()
        .catch(console.error) as Promise<void>;

    document.exitPictureInPicture().catch(console.error);
  };

  return (
    <GenericMenu className="str-video__participant-actions-context-menu">
      <GenericMenuButtonItem onClick={toggleParticipantPinnedAt}>
        <Icon icon="pin" />
        {participant.pinnedAt ? 'Unpin' : 'Pin'}
      </GenericMenuButtonItem>
      <Restricted requiredGrants={[OwnCapability.BLOCK_USERS]}>
        <GenericMenuButtonItem onClick={blockUser}>
          <Icon icon="not-allowed" />
          Block
        </GenericMenuButtonItem>
      </Restricted>
      {/* <GenericMenuButtonItem disabled onClick={kickUserClickHandler}>
        Kick
      </GenericMenuButtonItem> */}
      <Restricted requiredGrants={[OwnCapability.MUTE_USERS]}>
        <GenericMenuButtonItem
          disabled={
            !participant.publishedTracks.includes(SfuModels.TrackType.VIDEO)
          }
          onClick={muteVideo}
        >
          <Icon icon="camera-off-outline" />
          Turn off video
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          disabled={
            !participant.publishedTracks.includes(
              SfuModels.TrackType.SCREEN_SHARE,
            )
          }
          onClick={muteScreenShare}
        >
          <Icon icon="screen-share-off" />
          Turn off screen share
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          disabled={
            !participant.publishedTracks.includes(SfuModels.TrackType.AUDIO)
          }
          onClick={muteAudio}
        >
          <Icon icon="mic-off" />
          Mute audio
        </GenericMenuButtonItem>
      </Restricted>
      {participantViewElement && (
        <GenericMenuButtonItem onClick={toggleFullscreenMode}>
          {fullscreenModeOn ? 'Leave' : 'Enter'} fullscreen
        </GenericMenuButtonItem>
      )}
      {videoElement && document.pictureInPictureEnabled && (
        <GenericMenuButtonItem onClick={togglePictureInPicture}>
          {pictureInPictureElement === videoElement ? 'Leave' : 'Enter'}{' '}
          picture-in-picture
        </GenericMenuButtonItem>
      )}
      <Restricted requiredGrants={[OwnCapability.UPDATE_CALL_PERMISSIONS]}>
        <GenericMenuButtonItem
          onClick={grantPermission(OwnCapability.SEND_AUDIO)}
        >
          Allow audio
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          onClick={grantPermission(OwnCapability.SEND_VIDEO)}
        >
          Allow video
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          onClick={grantPermission(OwnCapability.SCREENSHARE)}
        >
          Allow screen sharing
        </GenericMenuButtonItem>

        <GenericMenuButtonItem
          onClick={revokePermission(OwnCapability.SEND_AUDIO)}
        >
          Disable audio
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          onClick={revokePermission(OwnCapability.SEND_VIDEO)}
        >
          Disable video
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          onClick={revokePermission(OwnCapability.SCREENSHARE)}
        >
          Disable screen sharing
        </GenericMenuButtonItem>
      </Restricted>
      {isAudioOutputChangeSupported && (
        <AudioOutputLevelSlider participant={participant} />
      )}
    </GenericMenu>
  );
};
