/* eslint-disable max-len */
'use strict'

module.exports = {
  wizard: {
    enterAppId: 'To create a new community, please enter the name of your new network',
    enterInvite: 'To join an existing community, paste your invite code here',
    continue: 'Continue',
    haveAccount: 'Do you already have an account on Digital Ocean?',
    accountYes: 'Yes, I already have an account.',
    accountNo: 'No, not yet.',
    getDOAccount: 'No problem! Please go, sign up on Digital Ocean. When you are done, come back.',
    giveApiKey: 'Awesome! Please fetch your API key from Digital Ocean and paste it here.',
    chooseOptions: 'Please choose the size of your network-droplet',
    confirmation: 'Almost done! Here is what you entered:',
    yesCreate: 'Yes, please create my new blockparty network',
    cancel: 'Cancel',
    goToDO: 'Go To Digital Ocean',
    dOURL: 'https://www.digitalocean.com/',
    madeAccount: 'I am logged in Digital Ocean now',
    paintWhileWaiting: 'Paint a nice picture, while waiting...',
    takeSomeTime: 'The procedure of setting up your new blockparty will take about 3 minutes. Enjoy yourself while waiting and paint a little.'
  },
  welcome: {
    hello: 'You Are Here! 🎉',
    firstP: 'Welcome to blockparty. We are happy, you made it. From here you can do two things:',
    setupBlockparty: 'Setup your first blockparty community and invite friends to join',
    readManual: 'Before diving into it, please take a few minutes to read our "How to setup a new community space" Ready? Ok, then lets go!',
    join: 'Join an existing blockparty community',
    joinCommunity: 'You want to join an existing blockparty community your friend created? All you need is an invite code. Paste it here:'
  },
  errors: {
    couldNotCreate: {
      title: 'No invite created',
      text: 'Oops, we could not create an invite code. Please try again.'
    },
    badInviteCode: {
      title: 'Bad invite code',
      text: 'Oh no, we were not able to process that invite code, please check, if you copied / pasted it correctly and try again.'
    },
    couldNotConnect: {
      title: 'Could not connect',
      text: 'Sorry, we are not able to connect to your pub, you may check, if it is running at Digital Ocean.'
    },
    couldNotPublishUsername: {
      title: 'Username not saved',
      text: 'Oops, we were not able to save your username, please restart Blockparty and try again.'
    },
    couldNotPublishMessage: {
      title: 'Message not published',
      text: 'Oh no! We were unable to publish your message. Please check, if your pub is running on Digital Ocean and your internet connection is working.'
    },
    ipTimeout: {
      title: 'Could not create server',
      text: "We weren't able to get the new pub's IP address. This sometimes happens, would you like to try again?"
    },
    pubInfoTimeout: {
      title: 'Could not install pub on server',
      text: "We were able to start a server on Digital Ocean, but something went wrong while installing the pub. Would you like to try again?"
    },
    wrongToken: {
      title: 'Wrong Digital Ocean Token',
      text: 'We were not able to authenticate you. Please check the Token you have entered.'
    },
    noInternet: {
      title: 'No internet connection',
      text: 'Please make sure you have an internet connection and try again.'
    }
  },
  invite: {
    title: 'Your invite code',
    text: 'Here is your invite code. Share it with your friends.'
  }

}
