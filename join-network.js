'use strict'
const setUpLocally = require('./set-up-locally')
const blockpartyDir = require('./blockparty-dir')


module.exports = async function (code) {
  //TODO error handling for wrong input
  const port = code.match(/:([0-9]+):/)[1]
  const [invite, appId, appName] = code.split('!')
  console.log(port)
  console.log(invite)
  console.log(appId)
  console.log(appName)
  //TODO 
  //write local data
  //TODO add network config
  setUpLocally(appName, blockpartyDir)
  //start sbot
  //use sbot to accept or decline invite code
  //show feed if code was accepted
}
