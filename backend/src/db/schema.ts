import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// --- chat_rooms テーブル ---
export const chatRooms = pgTable(
  'chat_rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user1SessionId: text('user1_session_id').notNull(),
    user2SessionId: text('user2_session_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('active'),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    closeReason: text('close_reason'),
  },
  (table) => [index('chat_rooms_status_idx').on(table.status)]
);

// --- messages テーブル ---
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => chatRooms.id, { onDelete: 'cascade' }),
    senderSessionId: text('sender_session_id').notNull(),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('messages_room_created_idx').on(table.roomId, table.createdAt),
    index('messages_room_sender_created_idx').on(
      table.roomId,
      table.senderSessionId,
      table.createdAt
    ),
  ]
);

// --- reports テーブル ---
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id').notNull(),
    reporterSessionId: text('reporter_session_id').notNull(),
    reason: text('reason').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('reports_room_id_idx').on(table.roomId),
    index('reports_created_at_idx').on(table.createdAt),
  ]
);

// --- リレーション定義 ---
export const chatRoomsRelations = relations(chatRooms, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  room: one(chatRooms, { fields: [messages.roomId], references: [chatRooms.id] }),
}));
