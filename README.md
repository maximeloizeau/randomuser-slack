## Quick slackbot to pick a random user from your Slack team
First experiments with slackbots and AWS lambda


The code in /index.js is the base code containing an express server that can be run on its own. This code was split subfolder to be used as lambda functions on AWS (selectRandomUser and slackACtionsEndpoint).


To deploy on AWS Lambda, you just need to create these 2 functions, upload each corresponding folder and define the environement variables:
 - ADMIN_USER: slack username of the receiving user
 - SLACK_TOKEN: secret token of the Slack app you have to create in your workspace
 - VERIFICATION_TOKEN: secret token you'll find in your Slack app settings


Note: you need to create a Slack app with 2 features: interactive components and bot users.


TODO: so many things:
 - send message when selected user replies NO
 - pick another user when selected user replies NO
 - make it a real installable slackbot,
 - make the messages content configurable,
 - add persistence
