// createTunnel.js
require('dotenv').config();
const { spawn } = require('child_process');

function createTunnel() {
  const localPort = process.env.DB_PORT || 5433;
  const remoteHost = process.env.REMOTE_DB_HOST;
  const remotePort = process.env.REMOTE_DB_PORT || 5432;
  const bastionHost = process.env.BASTION_HOST;
  const username = process.env.SSH_USERNAME;
  const privateKey = process.env.SSH_PRIVATE_KEY_PATH;
  const sshPort = process.env.SSH_PORT || '22';

  // Build the SSH command arguments:
  // -i: private key
  // -L: localPort:remoteHost:remotePort (forwarding)
  // -p: specify SSH port
  // -N: do not execute remote commands
  const sshArgs = [
    '-i', privateKey,
    '-L', `${localPort}:${remoteHost}:${remotePort}`,
    `${username}@${bastionHost}`,
    '-p', sshPort,
    '-N'
  ];

  console.log('Spawning SSH tunnel with command:', 'ssh', sshArgs.join(' '));

  // Spawn the SSH process; stdio: 'inherit' lets you see the SSH client's output
  const tunnelProcess = spawn('ssh', sshArgs, { stdio: 'inherit' });

  tunnelProcess.on('error', (err) => {
    console.error('Error spawning SSH tunnel:', err);
  });

  tunnelProcess.on('exit', (code, signal) => {
    console.error(`SSH tunnel process exited with code ${code} and signal ${signal}`);
  });

  // Return the process so we can kill it when needed
  return tunnelProcess;
}

module.exports = createTunnel;
