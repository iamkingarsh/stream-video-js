import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import {
  Call,
  StreamVideoParticipant,
  SfuModels,
} from '@stream-io/video-client';
import { useIsDebugMode } from '../Debug/useIsDebugMode';
import { DebugParticipantPublishQuality } from '../Debug/DebugParticipantPublishQuality';
import { DebugStatsView } from '../Debug/DebugStatsView';
import { Video } from './Video';

export const ParticipantBox = (props: {
  participant: StreamVideoParticipant;
  isMuted?: boolean;
  call: Call;
}) => {
  const { participant, isMuted = false, call } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    videoStream,
    audioStream,
    isLoggedInUser: isLocalParticipant,
    isSpeaking,
    sessionId,
    publishedTracks,
  } = participant;

  const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const hasVideo = publishedTracks.includes(SfuModels.TrackType.VIDEO);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasVideo) return;

    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      call.updateSubscriptionsPartial({
        [sessionId]: {
          videoDimension: {
            width,
            height,
          },
        },
      });
    });
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, [hasVideo, sessionId, call]);

  useEffect(() => {
    const $el = audioRef.current;
    console.log(`Attaching audio stream`, $el, audioStream);
    if (!$el) return;
    if (audioStream) {
      $el.srcObject = audioStream;
    }
    return () => {
      $el.srcObject = null;
    };
  }, [audioStream]);

  const isDebugMode = useIsDebugMode();
  return (
    <div
      className={clsx(
        'str-video__participant',
        isSpeaking && 'str-video__participant--speaking',
      )}
      ref={containerRef}
    >
      <audio autoPlay ref={audioRef} muted={isMuted} />
      <div className="str-video__video-container">
        <Video
          stream={videoStream}
          className={clsx(
            'str-video__remote-video',
            isLocalParticipant && 'mirror',
          )}
          muted={isMuted}
          autoPlay
        />
        <div className="str-video__participant_details">
          <span className="str-video__participant_name">
            {participant.userId}
            {!hasAudio && (
              <span className="str-video__participant_name--audio-muted"></span>
            )}
            {!hasVideo && (
              <span className="str-video__participant_name--video-muted"></span>
            )}
          </span>
          {isDebugMode && (
            <>
              <DebugParticipantPublishQuality
                participant={participant}
                call={call}
              />
              <DebugStatsView
                call={call}
                kind={isLocalParticipant ? 'publisher' : 'subscriber'}
                mediaStream={videoStream}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
