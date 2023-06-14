import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const feeds = pgTable('feeds', {
    id: serial('id').primaryKey(),
    guild_id: text('guild_id').notNull(),
    channel_id: text('channel_id').notNull(),
    channel_name: text('channel_name').notNull(),
    rss_uri: text('rss_uri').notNull(),
    last_item_hash: text('last_item_hash').notNull(),
    last_updated: timestamp('last_updated').notNull().defaultNow(),
    created_at: timestamp('created_at').notNull().defaultNow()
});
