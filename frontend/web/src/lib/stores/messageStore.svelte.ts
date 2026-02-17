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
  messageStore.messages = [...messageStore.messages, message];
}

export function removeMessage(messageId: string) {
  messageStore.messages = messageStore.messages.filter((m) => m.messageId !== messageId);
}

export function clearMessages() {
  messageStore.messages = [];
}
