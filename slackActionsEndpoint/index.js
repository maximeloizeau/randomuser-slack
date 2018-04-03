const querystring = require('querystring');
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

function sendMessage(user, messageDetails) {
  return web.im.open({
    user: user.id
  })
  .then(res => web.chat.postMessage(
    Object.assign({}, {
      channel: res.channel.id
    }, messageDetails)
  ));
}

function updateMessage(message, channel, updatedContent) {
  return web.chat.update(Object.assign({}, {
    channel: channel.id,
    text: message.text,
    ts: message.ts
  }, updatedContent));
}

function handleSelectedUserReply(payload) {
  const { actions, user } = payload;

  if(!actions.length) return Promise.reject("No actions from user");
  const action = actions[0];
  if(action.value === "yes") {
    return updateMessage(
      payload.original_message,
      payload.channel,
      { attachments: [{
        "text": `You replied "yes"`,
        "fallback": "_You replied already_",
        "color": "#3AA3E3",
        "attachment_type": "default"
      }]}
    )
    .then(() => Promise.all([
      sendMessage(user, { text: "Cool 👍" }),
      sendMessage(adminUser, { text: `${user.real_name || user.name} accepted to review your designs 🔥` }),
    ]))
  }
  else if(action.value === "no") {
    return updateMessage(
      payload.original_message,
      payload.channel,
      { attachments: [{
        "text": `You replied "no"`,
        "fallback": "_You replied already_",
        "color": "#3AA3E3",
        "attachment_type": "default"
      }]}
    )
    .then(() => sendMessage(user, {
      text: "Oh ok then."
    }))
  }
  else {

  }
}


exports.handler = (event, context, callback) => {
  const { payload } = querystring.parse(event.body);
  
  return web.users.list()
  .then(users => {
    const user = pickUser(users.members);
    adminUser = pickUser(users.members, process.env.ADMIN_USER);
  
    if (
      payload !== null &&
      payload !== undefined
    ) {
      const decodedPayload = JSON.parse(payload);
      if(decodedPayload.token !== process.env.VERIFICATION_TOKEN) {
        return Promise.resolve();
      }
      
      if(decodedPayload.callback_id === "random_selected") {
        return handleSelectedUserReply(decodedPayload);
      }
    }
  })
  .then(res => callback(null));
};