const fetch = require('node-fetch');
const moment = require('moment');

const Node_Name = global.Node_Name // Replace with your node name
const webhookUrl = process.env.BUILT_WEBHOOK; // Replace with your webhook URL

const messageBuffer = [];
const maxBufferSize = 50;
const bufferDuration = 5000;
const batchSize = 10;
const throttleDuration = 60000;
const queueLimit = 100;

let isSending = false;
let retryAfter = 0;
let throttled = false;

function createWebhookRequest(payload) {
  return fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
  });
}

function sendMessagesFromBuffer() {
  if (messageBuffer.length === 0) return;

  const tag = messageBuffer[0].tag;
  isSending = true;
  const messagesToSend = messageBuffer.slice(0, batchSize);
  const payload = {
    data: messagesToSend.map(({ message, count }) => {
      return `\`[${moment().format("DD-MM-YYYY HH:mm:ss")}]\` [${Node_Name}] ==> **${tag}**: ${message}` +
        (count > 1 ? ` (x${count})` : "");
    })
  };

  createWebhookRequest(payload)
    .then((response) => {
      isSending = false;
      if (response.status === 429) {
        retryAfter = parseInt(response.headers.get('retry-after')) || 0;
        throttled = true;
        setTimeout(() => {
          throttled = false;
          if (messageBuffer.length > 0) {
            sendMessagesFromBuffer();
          }
        }, throttleDuration);
      } else {
        retryAfter = 0;
        throttled = false;
        if (messageBuffer.length > 0) {
          sendMessagesFromBuffer();
        }
      }
    })
    .catch((error) => {
      isSending = false;
      console.error('Error sending webhook request:', error.message);
    });

  messageBuffer.splice(0, messagesToSend.length);
}

function log(msg, client, tag) {
  tag = tag || (client ? client.user.tag : "Client");
  const timeStamp = `[${moment().format("DD-MM-YYYY HH:mm:ss")}]`;

  if (messageBuffer.length > 0 && messageBuffer[messageBuffer.length - 1].message === msg && messageBuffer[messageBuffer.length - 1].tag === tag) {
    messageBuffer[messageBuffer.length - 1].count++;
  } else {
    messageBuffer.push({ message: msg, count: 1, tag });
  }

  if (messageBuffer.length >= maxBufferSize || messageBuffer.length > 0 && Date.now() - messageBuffer[0].timestamp >= bufferDuration) {
    sendMessagesInBatches();
  }

  if (!isSending && retryAfter <= 0 && !throttled) {
    sendMessagesFromBuffer();
  }
}

function sendMessagesInBatches() {
  const totalMessages = messageBuffer.reduce((total, { count }) => total + count, 0);
  const batches = Math.ceil(totalMessages / batchSize);
  for (let i = 0; i < batches; i++) {
    setTimeout(sendMessagesFromBuffer, i * (bufferDuration / batches));
  }
}

setInterval(sendMessagesInBatches, bufferDuration);

module.exports = log;
