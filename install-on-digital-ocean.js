'use strict'
const request = require('request-promise-native')
const makeInstallScript = require('./install-script')

module.exports = async function ({apiToken, name, region, size, appId, port, userKey}) {
  const opts = {
    method: 'POST',
    url: 'https://api.digitalocean.com/v2/droplets',
    body: {
      name,
      region,
      size,
      image: 'debian-9-x64',
      user_data: makeInstallScript(name, appId, port, userKey)
    },
    auth: { bearer: apiToken },
    json: true
  }
  try {
    const res = await request(opts)
    console.log(res)
    // what do we want to return from the response?
  } catch (err) {
    console.log(err)
  }
}
