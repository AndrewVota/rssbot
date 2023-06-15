import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Parser from 'rss-parser';
import { addFeed, allFeedsFromGuild, feedExists, removeFeed } from '../database/database.js';

export const command = new SlashCommandBuilder()
    .setName('rss')
    .setDescription('RSS Feed commands.')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('new')
            .setDescription('Add a new RSS Feed item to a channel')
            .addChannelOption((option) =>
                option
                    .setName('channel')
                    .setDescription('The channel to add the RSS Feed item to.')
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName('url')
                    .setDescription('The RSS Feed URI you would like to add.')
                    .setRequired(true)
            )
    )
    .addSubcommand((subcommand) =>
        subcommand.setName('list').setDescription('List all RSS Feed items.')
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('remove')
            .setDescription('Remove an RSS Feed item.')
            .addStringOption((option) =>
                option
                    .setName('id')
                    .setDescription('The ID of the RSS Feed item you would like to remove.')
                    .setRequired(true)
            )
    );

export const run = async (interaction: ChatInputCommandInteraction) => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'new':
            handleNew(interaction);
            break;
        case 'list':
            handleList(interaction);
            break;
        case 'remove':
            handleRemove(interaction);
            break;
    }
};

async function handleNew(interaction: ChatInputCommandInteraction) {
    const parser = new Parser();
    const guildID = interaction.guildId;
    const channelID = interaction.options.getChannel('channel').id;
    const channelName = interaction.options.getChannel('channel').name;
    const rssURI = interaction.options.getString('url');

    let feed: unknown;
    try {
        feed = await parser.parseURL(rssURI);
    } catch (error) {
        console.log('feed error: ' + error);
        return;
    }

    let exists: boolean = await feedExists(guildID, channelID, rssURI);
    if (exists) return;

    let addFeedSuccess = await addFeed(guildID, channelID, channelName, rssURI);
    if (!addFeedSuccess) return;

    await interaction.reply('RSS Feed added successfully!');
}

async function handleList(interaction: ChatInputCommandInteraction) {
    const guildID = interaction.guildId;

    const list = await allFeedsFromGuild(guildID);

    let message = '';

    for (const item of list) {
        message += `${item.channel_name} - ${item.id} - ${item.rss_uri}\n`;
    }

    await interaction.reply(
        '**RSS Feed List**\n' +
            'format: {Channel Name} - {ID} - {RSS Feed URI}\n' +
            '```' +
            message +
            '```'
    );
}

async function handleRemove(interaction: ChatInputCommandInteraction) {
    const guildID = interaction.guildId;
    const id = interaction.options.getString('id');

    if (guildID !== interaction.guildId) return;

    await removeFeed(id);
    await interaction.reply('RSS Feed removed successfully!');
}

export function buildEmbed(
    title: string,
    description: string,
    url: string,
    image: string,
    feedTitle: string
) {
    const embed = new EmbedBuilder()
        .setColor('#F99000')
        .setTitle(title)
        .setURL(url)
        .setThumbnail(image)
        .setTimestamp()
        .addFields({ name: 'source', value: feedTitle, inline: true });

    return embed;
}
