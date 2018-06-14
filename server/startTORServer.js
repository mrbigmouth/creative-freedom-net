const fs = require('fs');
const path = require('path');
const granax = require('granax');

function startTORServer({ TOR_DATA_PATH }) {
  if (!fs.existsSync(TOR_DATA_PATH)) {
    fs.mkdirSync(TOR_DATA_PATH, 0o700);
  }
  const torOption1 = {
    authOnConnect: true,
  };
  const torOption2 = [
    {
      HiddenServiceDir: TOR_DATA_PATH,
      HiddenServiceVersion: 3,
      HiddenServicePort: '3000 127.0.0.1:3000',
    },
    {
      DataDirectory: TOR_DATA_PATH,
    },
  ];
  const tor = granax(torOption1, torOption2);

  tor.on('ready', () => {
    const hostname = fs.readFileSync(path.join(TOR_DATA_PATH, 'hostname')).toString();
    console.info('hidden service v3 established at ', hostname);
  });
  tor.on('error', (err) => {
    console.error(err);
  });
}
module.exports = startTORServer;
