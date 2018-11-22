// modified from https://github.com/ahdinosaur/ssb-pub/blob/master/install.sh
// double backslashes for escaping because js removes the first one

/* eslint-disable no-useless-escape */
/* eslint-disable max-len */
'use strict'

module.exports = (appName, appId, port, wsPort, userKey) => {
  const appDir = `/root/.${appName}`
  return `#!/bin/bash

cd ~

#
# install docker and node
#
sudo apt update
sudo apt install -y curl dnsutils apt-transport-https ca-certificates software-properties-common
wget https://download.docker.com/linux/debian/gpg -O docker-gpg
sudo apt-key add docker-gpg
echo "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee -a /etc/apt/sources.list.d/docker.list
sudo apt update
sudo apt install -y docker-ce
sudo systemctl start docker
sudo systemctl enable docker
curl -sL https://deb.nodesource.com/setup_8.x | bash -
apt-get install -y nodejs

#
# install ssb-pub image
#
docker pull jfr3000/ssb-pub

#
# create sbot container
#
mkdir ${appDir}
chown -R 1000:1000 ${appDir}
cd ${appDir}
npm install ssb-whoareyou-http
cd ..

# create config with network id
ssb_host=$(dig +short myip.opendns.com @resolver1.opendns.com)
cat > ${appDir}/config <<EOF
${JSON.stringify({
    caps: {shs: appId},
    master: [userKey],
    host: '$ssb_host',
    port: port,
    ws: { port: wsPort },
    connections: {
      incoming: {
        net: [
          {
            port: port,
            scope: "public",
            transform: "shs"
          }
        ],
        ws: [
          {
            port: wsPort,
            scope: "public",
            transform: "shs"
          }
        ]
      }
    },
    plugins: {
      "ssb-whoareyou-http": true
    }
  }, null, 4
  )}
EOF


# create ./create-sbot script
cat > ./create-sbot <<EOF
#!/bin/sh

memory_limit=$(($(free -b --si | awk '/Mem\\:/ { print $2 }') - 200*(10**6)))

docker run -d --name sbot \\
   --mount type=bind,target=/home/node/.blockparty-pub,source=${appDir} \\
   -e ssb_host="\\$ssb_host" \\
   -e ssb_appname="blockparty-pub" \\
   -p ${port}:${port}\\
   -p ${wsPort}:${wsPort}\\
   --restart unless-stopped \\
   --memory "\\$memory_limit" \\
   jfr3000/ssb-pub

EOF

# make the script executable
chmod +x ./create-sbot
# run the script
./create-sbot

# create ./sbot script
cat > ./sbot <<EOF
#!/bin/sh

docker exec -it sbot sbot "\\$@"
EOF

# make the script executable
chmod +x ./sbot

#
# setup auto-healer
#
docker pull ahdinosaur/healer
docker run -d --name healer \\
  -v /var/run/docker.sock:/tmp/docker.sock \\
  --restart unless-stopped \\
  ahdinosaur/healer

# ensure containers are always running
printf '#!/bin/sh\\n\\ndocker start sbot\\n' | tee /etc/cron.hourly/sbot && chmod +x /etc/cron.hourly/sbot
printf '#!/bin/sh\\n\\ndocker start healer\\n' | tee /etc/cron.hourly/healer && chmod +x /etc/cron.hourly/healer

`
}
