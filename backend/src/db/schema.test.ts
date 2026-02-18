import type { PGlite } from '@electric-sql/pglite';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chatRooms, messages, reports } from './schema';
import { type TestDatabase, createTestDatabase } from './testHelper';

describe('データベースマイグレーション', () => {
  let db: TestDatabase;
  let client: PGlite;

  beforeAll(async () => {
    const result = await createTestDatabase();
    db = result.db;
    client = result.client;
  });

  afterAll(async () => {
    await client.close();
  });

  describe('テーブル作成', () => {
    it('chat_roomsテーブルが存在する', async () => {
      const result = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'chat_rooms'
      `);
      expect(result.rows).toHaveLength(1);
    });

    it('messagesテーブルが存在する', async () => {
      const result = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'messages'
      `);
      expect(result.rows).toHaveLength(1);
    });

    it('reportsテーブルが存在する', async () => {
      const result = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'reports'
      `);
      expect(result.rows).toHaveLength(1);
    });
  });

  describe('カラム定義', () => {
    it('chat_roomsテーブルのカラムが正しい', async () => {
      const result = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'chat_rooms'
        ORDER BY ordinal_position
      `);
      const columns = result.rows as Array<{
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
      }>;

      const columnMap = new Map(columns.map((c) => [c.column_name, c]));

      expect(columnMap.get('id')?.data_type).toBe('uuid');
      expect(columnMap.get('id')?.is_nullable).toBe('NO');

      expect(columnMap.get('user1_session_id')?.data_type).toBe('text');
      expect(columnMap.get('user1_session_id')?.is_nullable).toBe('NO');

      expect(columnMap.get('user2_session_id')?.data_type).toBe('text');
      expect(columnMap.get('user2_session_id')?.is_nullable).toBe('NO');

      expect(columnMap.get('created_at')?.data_type).toBe('timestamp with time zone');
      expect(columnMap.get('created_at')?.is_nullable).toBe('NO');

      expect(columnMap.get('expires_at')?.data_type).toBe('timestamp with time zone');
      expect(columnMap.get('expires_at')?.is_nullable).toBe('NO');

      expect(columnMap.get('status')?.data_type).toBe('text');
      expect(columnMap.get('status')?.is_nullable).toBe('NO');
      expect(columnMap.get('status')?.column_default).toContain('active');

      expect(columnMap.get('closed_at')?.data_type).toBe('timestamp with time zone');
      expect(columnMap.get('closed_at')?.is_nullable).toBe('YES');

      expect(columnMap.get('close_reason')?.data_type).toBe('text');
      expect(columnMap.get('close_reason')?.is_nullable).toBe('YES');
    });

    it('messagesテーブルのカラムが正しい', async () => {
      const result = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'messages'
        ORDER BY ordinal_position
      `);
      const columns = result.rows as Array<{
        column_name: string;
        data_type: string;
        is_nullable: string;
      }>;

      const columnMap = new Map(columns.map((c) => [c.column_name, c]));

      expect(columnMap.get('id')?.data_type).toBe('uuid');
      expect(columnMap.get('room_id')?.data_type).toBe('uuid');
      expect(columnMap.get('room_id')?.is_nullable).toBe('NO');
      expect(columnMap.get('sender_session_id')?.data_type).toBe('text');
      expect(columnMap.get('text')?.data_type).toBe('text');
      expect(columnMap.get('created_at')?.data_type).toBe('timestamp with time zone');
    });

    it('reportsテーブルのカラムが正しい', async () => {
      const result = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'reports'
        ORDER BY ordinal_position
      `);
      const columns = result.rows as Array<{
        column_name: string;
        data_type: string;
        is_nullable: string;
      }>;

      const columnMap = new Map(columns.map((c) => [c.column_name, c]));

      expect(columnMap.get('id')?.data_type).toBe('uuid');
      expect(columnMap.get('room_id')?.data_type).toBe('uuid');
      expect(columnMap.get('reporter_session_id')?.data_type).toBe('text');
      expect(columnMap.get('reason')?.data_type).toBe('text');
      expect(columnMap.get('created_at')?.data_type).toBe('timestamp with time zone');
    });
  });

  describe('インデックス', () => {
    it('定義したインデックスが全て存在する', async () => {
      const result = await db.execute(sql`
        SELECT indexname FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY indexname
      `);
      const indexNames = (result.rows as Array<{ indexname: string }>).map((r) => r.indexname);

      expect(indexNames).toContain('chat_rooms_status_idx');
      expect(indexNames).toContain('messages_room_created_idx');
      expect(indexNames).toContain('messages_room_sender_created_idx');
      expect(indexNames).toContain('reports_room_id_idx');
      expect(indexNames).toContain('reports_created_at_idx');
    });
  });

  describe('外部キー制約', () => {
    it('messages.room_idがchat_rooms.idへのFK制約を持つ', async () => {
      const result = await db.execute(sql`
        SELECT
          tc.constraint_name,
          rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'messages'
          AND tc.constraint_type = 'FOREIGN KEY'
      `);
      const fk = result.rows[0] as { constraint_name: string; delete_rule: string } | undefined;

      expect(fk).toBeDefined();
      expect(fk?.delete_rule).toBe('CASCADE');
    });

    it('reportsテーブルにはFK制約がない', async () => {
      const result = await db.execute(sql`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'reports'
          AND constraint_type = 'FOREIGN KEY'
      `);
      expect(result.rows).toHaveLength(0);
    });
  });

  describe('CRUD操作', () => {
    it('chat_roomsにレコードを挿入・取得できる', async () => {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const inserted = await db
        .insert(chatRooms)
        .values({
          user1SessionId: '00000000-0000-4000-a000-000000000001',
          user2SessionId: '00000000-0000-4000-a000-000000000002',
          expiresAt,
        })
        .returning();

      expect(inserted).toHaveLength(1);
      expect(inserted[0].id).toBeDefined();
      expect(inserted[0].status).toBe('active');
      expect(inserted[0].closedAt).toBeNull();
    });

    it('messagesにレコードを挿入・取得できる', async () => {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const [room] = await db
        .insert(chatRooms)
        .values({
          user1SessionId: '00000000-0000-4000-a000-000000000003',
          user2SessionId: '00000000-0000-4000-a000-000000000004',
          expiresAt,
        })
        .returning();

      const inserted = await db
        .insert(messages)
        .values({
          roomId: room.id,
          senderSessionId: '00000000-0000-4000-a000-000000000003',
          text: 'こんにちは！',
        })
        .returning();

      expect(inserted).toHaveLength(1);
      expect(inserted[0].text).toBe('こんにちは！');
    });

    it('reportsにレコードを挿入・取得できる', async () => {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const [room] = await db
        .insert(chatRooms)
        .values({
          user1SessionId: '00000000-0000-4000-a000-000000000005',
          user2SessionId: '00000000-0000-4000-a000-000000000006',
          expiresAt,
        })
        .returning();

      const inserted = await db
        .insert(reports)
        .values({
          roomId: room.id,
          reporterSessionId: '00000000-0000-4000-a000-000000000005',
          reason: 'spam',
        })
        .returning();

      expect(inserted).toHaveLength(1);
      expect(inserted[0].reason).toBe('spam');
    });

    it('chat_room削除時にmessagesがCASCADE削除される', async () => {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const [room] = await db
        .insert(chatRooms)
        .values({
          user1SessionId: '00000000-0000-4000-a000-000000000010',
          user2SessionId: '00000000-0000-4000-a000-000000000020',
          expiresAt,
        })
        .returning();

      await db.insert(messages).values({
        roomId: room.id,
        senderSessionId: '00000000-0000-4000-a000-000000000010',
        text: '削除テスト用メッセージ',
      });

      await db.delete(chatRooms).where(eq(chatRooms.id, room.id));

      const remainingMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.roomId, room.id));
      expect(remainingMessages).toHaveLength(0);
    });
  });
});
