const assert = require('assert');
const { sha3_224: sha224 } = require('js-sha3');
const NodeRSA = require('node-rsa');
const path = require('path');
const fs = require('fs');
const rmdir = require('rimraf');
const Node = require('../lib/kademlia/Node');
const FileStorage = require('../lib/FileStorage');

const nodeHash = {};
const transport = {
  request(contact, data) {
    return new Promise((resolve, reject) => {
      const address = contact.address.join(':');
      const node = nodeHash[address];
      if (node) {
        node.handleRequest(data)
          .then((result) => {
            resolve(JSON.parse(result));
          })
          .catch(reject);
      }
      else {
        reject(new Error('404'));
      }
    });
  },
};

const testKeyPath = path.join(__dirname, 'data', 'key');
const storagePath = path.join(__dirname, 'data', 'storage');

let nodeList = [];
describe('Node', () => {
  before(function() {
    this.timeout(7200000);
    rmdir.sync(storagePath);
    fs.mkdirSync(storagePath);
    // may take very long time
    for (let i = 0; i < 1000; i += 1) {
    // for (let i = 0; i < 100; i += 1) {
      const privateKey = fs.readFileSync(path.join(testKeyPath, i + '.key'));
      const key = new NodeRSA();
      key.importKey(privateKey, 'private');
      const publicKey = key.exportKey('public');
      const id = sha224(publicKey);
      const hostname = `test${i}.com`;
      const port = '8888';
      const address = [hostname, port];
      nodeHash[address.join(':')] = new Node({
        identity: {
          id,
          key,
          publicKey,
        },
        storage: new FileStorage(path.join(storagePath, hostname)),
        transport,
        address,
      });
    }
    nodeList = Object.values(nodeHash);
  });
  it('can join another node.', () => {
    return nodeList[1].join(nodeList[0].contact);
  });
  it('after refresh, can store contact at net.', () => {
    return nodeList[1].refresh().then(() => {
      return nodeList[0].storage.get(nodeList[1].contact.id);
    });
  });
  describe('#whole net search healthy', () => {
    before(function() {
      this.timeout(3600000);
      let promise = Promise.resolve(true);
      nodeList.forEach((node, index) => {
        const anotherIndex = (index + 1) % nodeList.length;

        promise = promise.then(() => {
          // report test progress
          return node.join(nodeList[anotherIndex].contact).then(() => {
            console.log(`node${index} join node${anotherIndex} done!`);
          });
        });
      });
      nodeList.forEach((node, index) => {
        promise = promise.then(() => {
          // report test progress
          return node.refresh().then(() => {
            console.log(`node${index} refresh done!`);
          });
        });
      });

      return promise;
    });
    it('any random node can find another random node in a short time.', function() {
      this.timeout(600000);
      const promiseList = [];
      for (let i = 0; i < 1000; i += 1) {
        let randomNumber1;
        let randomNumber2;
        while (randomNumber1 === randomNumber2) {
          randomNumber1 = Math.floor(Math.random() * nodeList.length);
          randomNumber2 = Math.floor(Math.random() * nodeList.length);
        }
        const randomNode1 = nodeList[randomNumber1];
        const randomNode2 = nodeList[randomNumber2];

        const promise = randomNode1.searchSpecificNodeContact(randomNode2.contact.id)
          .then((contact) => {
            assert.equal(typeof contact, 'object');
            assert.equal(contact.id, randomNode2.contact.id);
          })
          .catch(() => {
            console.error(`node${randomNumber1} can't find node${randomNumber2}!`);
          });
        promiseList.push(promise);
      }

      return Promise.all(promiseList);
    });
  });
});
