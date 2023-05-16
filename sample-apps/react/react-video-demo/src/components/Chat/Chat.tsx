import { FC, useEffect } from 'react';
import { StreamChat as StreamChatInterface } from 'stream-chat';
import {
  Chat as StreamChat,
  Channel,
  Window,
  MessageList,
  MessageInput,
  useChatContext,
  useChannelStateContext,
} from 'stream-chat-react';

import ChatInput from '../ChatInput';
import { ChatRound } from '../Icons';
import GiphyPreview from '../GiphyPreview';

import { GiphyContextProvider } from '../../contexts/GiphyContext';

import { useOverrideSubmit } from '../../utils/useOverwriteChatSubmitHandler';

import 'stream-chat-react/dist/css/v2/index.css';
import styles from './Chat.module.css';

export type Props = {
  channelId: string;
  client?: StreamChatInterface | null;
  channelType: string;
};

export const NoMessages = () => {
  const { messages } = useChannelStateContext();

  if (messages?.length === 0) {
    return (
      <div className={styles.noMessages}>
        <ChatRound className={styles.chatRound} />
        <p className={styles.description}>Let’s start chatting!</p>
        <p className={styles.description}>
          How about sending your first message to a friend?
        </p>
      </div>
    );
  }
  return null;
};

export const ActiveChat: FC<Props> = ({ channelId, channelType }) => {
  const { client, setActiveChannel } = useChatContext();
  const overrideSubmitHandler = useOverrideSubmit();

  useEffect(() => {
    const channel = client.channel(channelType, channelId);

    setActiveChannel(channel);
  }, [channelId, client, setActiveChannel]);

  return (
    <Channel
      Input={() => <ChatInput />}
      EmptyStateIndicator={NoMessages}
      GiphyPreviewMessage={GiphyPreview}
    >
      <Window>
        <MessageList />
        <MessageInput />
      </Window>
    </Channel>
  );
};

export const Chat: FC<Props> = (props) => {
  const { client } = props;
  if (!client) return <div>Loading Chat...</div>;

  return (
    <StreamChat theme="str-chat__theme-dark" client={client}>
      <GiphyContextProvider>
        <ActiveChat {...props} />
      </GiphyContextProvider>
    </StreamChat>
  );
};
