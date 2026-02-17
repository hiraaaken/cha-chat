export interface StoreMessage {
  readonly messageId: string;
  readonly senderSessionId: string;
  readonly text: string;
  readonly createdAt: string;
}

class MessageStore {
  messages = $state<StoreMessage[]>([]);

  addMessage = (message: StoreMessage) => {
    this.messages = [...this.messages, message];
  };

  removeMessage = (messageId: string) => {
    this.messages = this.messages.filter((m) => m.messageId !== messageId);
  };

  clearMessages = () => {
    this.messages = [];
  };
}

export const messageStore = new MessageStore();
