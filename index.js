const express = require('express');
const bodyparser = require('body-parser');
const { WebClient } = require('@slack/client');

const token = process.env.SLACK_TOKEN;
const web = new WebClient(token);

let adminUser;

function pickUser(users, username) {
  if(username) {
    return users.find(user => 
      user.name === username
    );    
  }

  return users[Math.floor(Math.random()*users.length)];
}

async function sendMessage(user, messageDetails) {
  const { channel } = await web.im.open({
    user: user.id
  });

  await web.chat.postMessage({
    channel: channel.id,
    ...messageDetails
  });
}

async function updateMessage(message, channel, updatedContent) {
  await web.chat.update({
    channel: channel.id,
    text: message.text,
    ts: message.ts,
    ...updatedContent
  });
}

async function handleSelectedUserReply(payload) {
  const { actions, user } = payload;

  if(!actions.length) return Promise.reject("No actions from user");
  const action = actions[0];
  if(action.value === "yes") {
    await updateMessage(
      payload.original_message,
      payload.channel,
      { attachments: [{
        "text": `You replied "yes"`,
        "fallback": "_You replied already_",
        "color": "#3AA3E3",
        "attachment_type": "default"
      }]}
    )
    await Promise.all([
      sendMessage(user, { text: "Cool 👍" }),
      sendMessage(adminUser, { text: `${user.real_name || user.name} accepted to review your designs 🔥` }),
    ])
  }
  else if(action.value === "no") {
    await updateMessage(
      payload.original_message,
      payload.channel,
      { attachments: [{
        "text": `You replied "no"`,
        "fallback": "_You replied already_",
        "color": "#3AA3E3",
        "attachment_type": "default"
      }]}
    )
    await sendMessage(user, {
      text: "Oh ok then."
    })
  }
  else {

  }
}

async function handleSlackActionRequest(req, res) {
  res.status(200).end();
  const payload = JSON.parse(req.body.payload);

  if(payload.callback_id === "random_selected") {
    await handleSelectedUserReply(payload);
  }
}

async function startServer() {
  const app = express();

  app.post(
    '/slack/actions',
    bodyparser.urlencoded({ extended: false }),
    handleSlackActionRequest
  );

  const port = process.env.PORT || 8080;
  const httpServer = require('http').createServer(app);
  
  return new Promise((resolve, reject) => {
    httpServer.listen(port, function() {
      console.log("Server started on " + port)
      resolve(app);
    });
  });
}

async function main() {
  const server = await startServer();

  const { members } = await web.users.list()
  const user = pickUser(members);
  adminUser = pickUser(members, process.env.ADMIN_USER);

  const selectionMessageDetails = {
    text: "You've been selected to help us review our designs.",
    attachments: [
      {
        "text": "Are you ok to help?",
        "fallback": "You are unable to reply",
        "callback_id": "random_selected",
        "color": "#3AA3E3",
        "attachment_type": "default",
        "actions": [
          {
            "name": "yes",
            "text": "Yes",
            "type": "button",
            "value": "yes"
          },
          {
            "name": "no",
            "text": "No",
            "type": "button",
            "value": "no"
          }
        ]
      }
    ]
  }
  await sendMessage(user, selectionMessageDetails);
}

main();