// sshTunnel.js
const fs = require('fs');
const tunnelModule = require('tunnel-ssh');
const tunnel = tunnelModule.default || tunnelModule;

const privateKey = fs.readFileSync(process.env.SSH_PRIVATE_KEY_PATH, 'utf8').trim();
console.log("Private key length:", privateKey.length);

function createSshTunnel() {
  const config = {
    username: process.env.SSH_USERNAME,
    host: process.env.BASTION_HOST,
    port: Number(process.env.SSH_PORT) || 22,
    privateKey: privateKey,
    passphrase: process.env.SSH_PRIVATE_KEY_PASSPHRASE || undefined,
    dstHost: process.env.REMOTE_DB_HOST,
    dstPort: Number(process.env.REMOTE_DB_PORT) || 5432,
    localHost: '127.0.0.1',
    localPort: Number(process.env.DB_PORT) || 5433,
    debug: console.log,
    // Remove explicit algorithms to allow automatic negotiation
    // algorithms: { ... }  <-- REMOVED
  };

  return new Promise((resolve, reject) => {
    tunnel(config, (err, server) => {
      if (err) {
        return reject(err);
      }
      console.log('SSH tunnel established on 127.0.0.1:' + (process.env.DB_PORT || 5433));
      resolve(server);
    });
  });
}

module.exports = createSshTunnel;
