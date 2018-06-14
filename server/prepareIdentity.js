const fs = require('fs');
const NodeRSA = require('node-rsa');
const { sha3_224: sha224 } = require('js-sha3');

const identity = {};
module.exports = function prepareIdentity({ IDENTITY_PATH }) {
  if (identity.id) {
    return true;
  }

  const key = new NodeRSA();
  if (fs.existsSync(IDENTITY_PATH)) {
    const privateKey = fs.readFileSync(IDENTITY_PATH).toString('utf8');
    key.importKey(privateKey, 'private');
  }
  else {
    key.generateKeyPair();
    const privateKey = key.exportKey('private');
    const fd = fs.openSync(IDENTITY_PATH, 'w+');
    fs.writeSync(fd, privateKey);
  }
  identity.key = key;
  identity.publicKey = key.exportKey('public');
  identity.id = sha224(identity.publicKey);

  return true;
};
