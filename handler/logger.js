const fetch = require('node-fetch');
const moment = require('moment');

const webhookUrl = process.env.BUILT_WEBHOOK; // Replace with your webhook URL

const messageBuffer = [];
const maxBufferSize = 100; // Increased from 50 to 100
const bufferDuration = 10000; // Increased from 5000ms to 10000ms (10 seconds)
const batchSize = 50; // Increased from 10 to 20
const throttleDuration = 30000; // Strict 15 seconds rate limit
const queueLimit = 200; // Increased from 100 to 200

let isSending = false;
let retryAfter = 0;
let throttled = false;
let sendInterval; // Store the interval ID for sending messages

function createWebhookRequest(payload, id) {
  return fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ...payload, id }), // Include the id property in the payload
  });
}

function sendMessagesFromBuffer() {
  if (messageBuffer.length === 0) return;

  const tag = messageBuffer[0].tag;
  const id = messageBuffer[0].id;
  isSending = true;
  const messagesToSend = messageBuffer.splice(0, batchSize);
  const payload = {
    data: messagesToSend.map(({ message, count }) => {
      return `\`${id} [${moment().format("DD-MM-YYYY HH:mm:ss")}]\` [${tag}] ==> ${message}` +
        (count > 1 ? ` x${count}` : "");
    })
  };

  createWebhookRequest(payload, id)
    .then((response) => {
      isSending = false;
      if (response.status === 429) {
        retryAfter = parseInt(response.headers.get('retry-after')) || 0;
        throttled = true;
      } else {
        retryAfter = 0;
        throttled = false;
      }
    })
    .catch((error) => {
      isSending = false;
      console.error('Error sending webhook request:', error.message);
    });
}

function log(msg, client) {
  const tag = client ? client.user.tag : "Client";
  const id = client ? client.user.id : "";
  const timeStamp = `[${moment().format("DD-MM-YYYY HH:mm:ss")}]`;

  if (Array.isArray(msg)) {
    messageBuffer.push(...msg.map(message => ({ message, count: 1, tag, id }))); // Include the id property in the log object
    // Start the sending interval if not already started
    if (!sendInterval) {
      sendInterval = setInterval(() => {
        if (!isSending && retryAfter <= 0 && !throttled && messageBuffer.length > 0) {
          sendMessagesFromBuffer();
        }
      }, throttleDuration);
    }
    return;
  }

  if (messageBuffer.length > 0 && messageBuffer[messageBuffer.length - 1].message === msg && messageBuffer[messageBuffer.length - 1].tag === tag) {
    messageBuffer[messageBuffer.length - 1].count++;
  } else {
    messageBuffer.push({ message: msg, count: 1, tag, id }); // Include the id property in the log object
  }

  if (messageBuffer.length >= maxBufferSize || messageBuffer.length > 0 && Date.now() - messageBuffer[0].timestamp >= bufferDuration) {
    sendMessagesInBatches();
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

module.exports = { log };
