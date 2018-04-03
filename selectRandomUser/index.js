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

exports.handler = (event, context, callback) => {
  return web.users.list()
  .then(users => {
    const user = pickUser(users.members);
    adminUser = pickUser(users.members, process.env.ADMIN_USER);

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
    };
    return sendMessage(user, selectionMessageDetails);
  });
};