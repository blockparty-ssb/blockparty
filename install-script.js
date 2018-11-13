// modified from https://github.com/ahdinosaur/ssb-pub/blob/master/install.sh
// double backslashes for escaping because js removes the first one

/* eslint-disable no-useless-escape */
/* eslint-disable max-len */
'use strict'

module.exports = (appName, appId, appPort, userKey) => {
  const appDir = `~/${appName}-ssb-pub-data`
  return `#!/bin/bash

cd ~

#
# install docker
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

#
# install ssb-pub image
#
docker pull ahdinosaur/ssb-pub

#
# create sbot container
#
mkdir ${appDir}
# create config with network id
cat > ${appDir}/config <<EOF
${JSON.stringify({
    caps: {shs: appId},
    master: [userKey]
  }, null, 4
  )}
EOF
chown -R 1000:1000 ${appDir}


# create ./create-sbot script
cat > ./create-sbot <<EOF
#!/bin/sh

ssb_host=$(dig +short myip.opendns.com @resolver1.opendns.com)
memory_limit=$(($(free -b --si | awk '/Mem\\:/ { print $2 }') - 200*(10**6)))

docker run -d --name sbot \\
   -v ${appDir}/:/home/node/.ssb/ \\
   -e ssb_host="\\$ssb_host" \\
   -p ${appPort}:8008 \\
   --restart unless-stopped \\
   --memory "\\$memory_limit" \\
   ahdinosaur/ssb-pub

sbot plugins.install ssb-whoareyou-http
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
