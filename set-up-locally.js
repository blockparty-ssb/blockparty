'use strict'
const path = require('path')
const fs = require('fs')

module.exports = (appName, shsKey, port, wsPort, blockpartyDir) => {
  const appDir = makeAppDirectory(appName)
  const networkConfig = {
    caps: {
      shs: shsKey
    },
    port: port,
    allowPrivate: true,
    ws: {
      port: wsPort
    },
    connections: {
      incoming: {
        net: [{ port: port, scope: "public", transform: "shs" }]
      }
    }
  }
  fs.writeFileSync(path.join(appDir, 'config'), JSON.stringify(networkConfig, null, 4))
  return appDir

  function makeAppDirectory (appId) {
  // TODO check and handle if .blockparty is a file, not a directory
    if (!fs.existsSync(blockpartyDir)) {
    // TODO error handling
      fs.mkdirSync(blockpartyDir)
    }
    try {
      const appDirectory = path.join(blockpartyDir, appId)
      fs.mkdirSync(appDirectory)
      return appDirectory
    } catch (err) {
      console.log(err)
      console.log('ups')
    }
  }
}
