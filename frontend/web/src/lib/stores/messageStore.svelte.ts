export interface StoreMessage {
  readonly messageId: string;
  readonly senderSessionId: string;
  readonly text: string;
  readonly createdAt: string;
}

export const messageStore = $state({
  messages: [] as StoreMessage[],
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
