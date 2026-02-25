const MAX_MESSAGES_PER_SENDER = 3;

export interface StoreMessage {
  readonly messageId: string;
  readonly senderSessionId: string;
  readonly text: string;
  readonly createdAt: string;
}

interface MessageState {
  messages: StoreMessage[];
}

export const messageStore = $state<MessageState>({
  messages: [],
});

export function addMessage(message: StoreMessage) {
  const updated = [...messageStore.messages, message];

  const senderMessages = updated.filter(
    (m) => m.senderSessionId === message.senderSessionId,
  );

  if (senderMessages.length > MAX_MESSAGES_PER_SENDER) {
    const oldestId = senderMessages[0].messageId;
    messageStore.messages = updated.filter((m) => m.messageId !== oldestId);
  } else {
    messageStore.messages = updated;
  }
}

export function removeMessage(messageId: string) {
  messageStore.messages = messageStore.messages.filter((m) => m.messageId !== messageId);
}

export function clearMessages() {
  messageStore.messages = [];
}
