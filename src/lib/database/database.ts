import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { feeds } from './schema.js';
import { and, eq } from 'drizzle-orm';

const client = postgres(process.env.DATABASE_URI);
const db = drizzle(client);

export default db;

export function endDatabaseConnection() {
    client.end();
}

export async function feedExists(guildID: string, channelID: string, rssURI: string) {
    try {
        const result = await db
            .select({
                guild_id: feeds.guild_id,
                channel_id: feeds.channel_id,
                rss_uri: feeds.rss_uri
            })
            .from(feeds)
            .where(
                and(
                    eq(feeds.guild_id, guildID),
                    eq(feeds.channel_id, channelID),
                    eq(feeds.rss_uri, rssURI)
                )
            );

        if (result.length > 0) return true;
        return false;
    } catch (error) {
        return false;
    }
}

export async function addFeed(
    guildID: string,
    channelID: string,
    channelName: string,
    rssURI: string
) {
    const MILLI_IN_MINUTE = 60000;
    const MINUTES_AGO = 10;

    try {
        await db.insert(feeds).values({
            guild_id: guildID,
            channel_id: channelID,
            channel_name: channelName,
            rss_uri: rssURI,
            last_item_hash: '',
            last_updated: new Date(Date.now() - MINUTES_AGO * MILLI_IN_MINUTE)
        });

        return true;
    } catch (error) {
        return false;
    }
}

export async function allFeedsFromGuild(guildID: string) {
    try {
        const result = await db
            .select({
                id: feeds.id,
                guild_id: feeds.guild_id,
                channel_id: feeds.channel_id,
                channel_name: feeds.channel_name,
                rss_uri: feeds.rss_uri
            })
            .from(feeds)
            .where(eq(feeds.guild_id, guildID));

        return result;
    } catch (error) {
        return [];
    }
}

export async function removeFeed(id: string) {
    try {
        await db.delete(feeds).where(eq(feeds.id, +id));
        return true;
    } catch (error) {
        return false;
    }
}
