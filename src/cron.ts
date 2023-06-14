import Parser from 'rss-parser';
import db from './lib/database/database.js';
import { feeds } from './lib/database/schema.js';
import { buildEmbed } from './lib/commands/rss.js';
import client from './lib/client/client.js';
import { TextChannel } from 'discord.js';
import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import sleep from './lib/utilities/Sleep.js';

const POLL_INTERVAL = 2500;
const TEN_MINUTES_MILLI = 600000;
const RSS_ICON_CDN =
    'https://wp-assets.rss.com/blog/wp-content/uploads/2019/10/10111557/social_style_3_rss-512-1.png';

while (true) {
    await sleep(POLL_INTERVAL);

    try {
        const result = await db.select().from(feeds).orderBy(feeds.last_updated).limit(1);
        if (result.length === 0) continue;
        if (result[0].last_updated > new Date(Date.now() - TEN_MINUTES_MILLI)) continue;

        const parser = new Parser();
        const feed = await parser.parseURL(result[0].rss_uri);
        const firstItemHash = createHash('sha256')
            .update(JSON.stringify(feed.items[0]))
            .digest('hex');

        if (result[0].last_item_hash != firstItemHash) {
            const channel = client.channels.cache.get(result[0].channel_id) as TextChannel;

            if (channel) {
                for (const itemIndex in feed.items) {
                    const item = feed.items[itemIndex];
                    const itemHash = createHash('sha256')
                        .update(JSON.stringify(item))
                        .digest('hex');
                    if (itemHash === result[0].last_item_hash) break;

                    let title = item.title ? item.title.slice(0, 255) : 'no title...';
                    let description = feed.description
                        ? feed.description.slice(0, 255)
                        : 'no description...';
                    let url = item.link;
                    let image = feed.image?.url ? feed.image?.url : RSS_ICON_CDN;
                    let feedTitle = feed.title ? feed.title.slice(0, 255) : 'no title...';

                    if (!url) break;

                    const embed = buildEmbed(title, description, url, image, feedTitle);

                    await channel.send({ embeds: [embed] });
                }
            }
        }

        await db
            .update(feeds)
            .set({ last_updated: new Date(Date.now()), last_item_hash: firstItemHash })
            .where(eq(feeds.id, result[0].id));
    } catch (error) {
        console.log(error);
    }
}
