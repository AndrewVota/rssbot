import { ChatInputCommandInteraction, Events, PermissionsBitField } from 'discord.js';
import client from './lib/client/client.js';
import { run as handleRssCommand } from './lib/commands/rss.js';
import { fork } from 'child_process';
import { config } from 'dotenv';
config();

const cron = fork('./dist/cron.js');

const DISCORD_BOT_USER_ID = process.env.DISCORD_BOT_USER_ID;

client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on('interactionCreate', async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
        interaction.reply({
            content: 'You do not have permission to use this command.',
            ephemeral: true
        });
        return;
    }

    if (
        !interaction.channel
            .permissionsFor(DISCORD_BOT_USER_ID)
            ?.has(PermissionsBitField.Flags.ViewChannel)
    ) {
        interaction.reply({
            content: 'I do not have permission to view this channel, I cannot post here.',
            ephemeral: true
        });
        return;
    }

    const command = interaction.commandName;
    switch (command) {
        case 'rss':
            handleRssCommand(interaction);
            break;
    }
});
