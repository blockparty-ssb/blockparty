'use strict'
const request = require('request-promise-native')
const makeInstallScript = require('./install-script')

module.exports = async function ({apiToken, name, region, size, appId, port, wsPort, userKey}) {
  const opts = {
    method: 'POST',
    url: 'https://api.digitalocean.com/v2/droplets',
    body: {
      name,
      region,
      size,
      image: 'debian-9-x64',
      user_data: makeInstallScript(name, appId, port, wsPort, userKey)
    },
    auth: { bearer: apiToken },
    json: true
  }
  try {
    const res = await request(opts)
    const ip = await getIP(res.droplet)
    console.log('ip', ip)
    const key = await getKey(ip, wsPort)
    return {ip, key}
  } catch (err) {
    console.log(err)
  }

  async function getIP(droplet) {
    // it sometimes takes a while until DO tells us about the IP adress, so we
    // keep asking until we have it
    if (droplet.networks.v4.length) return droplet.networks.v4[0].ip_address
    const dropletUrl = `https://api.digitalocean.com/v2/droplets/${droplet.id}`
    const res2 = await request({
      method: 'GET',
      url: dropletUrl,
      auth: {bearer: apiToken},
      json: true
    })
    await promisifiedSetTimeout(10 * 1000)
    console.log('requesting ip')
    return await getIP(res2.droplet)
  }
}

async function getKey(ip, port) {
  const url = `http://${ip}:${port}/whoareyou`
  try {
    console.log('making request', url)
    const key = await request(url)
    return key
  } catch (err) {
    await promisifiedSetTimeout(20 * 1000)
    return getKey(ip, port)
  }
}

function promisifiedSetTimeout(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms)
  })
}
