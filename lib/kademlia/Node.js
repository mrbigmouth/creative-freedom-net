const NodeRSA = require('node-rsa');
const kademlia = require('./kademlia');
const Bucket = require('./Bucket');
const defaultStorage = require('./storage');
const defaultTransport = require('./transport');
const { sha3_224: sha224 } = require('js-sha3');

function doNothing() {
}

// http://xlattice.sourceforge.net/components/protocol/kademlia/specs.html
class Node {
  constructor({
    identity,
    type,
    storage,
    transport,
    address,
  }) {
    // initialize attributes
    this.identity = identity;
    this.type = type;
    this.storage = storage || defaultStorage;
    this.transport = transport || defaultTransport;
    const contact = {
      id: identity.id,
      publicKey: identity.publicKey,
      address,
    };
    this.contact = contact;
    this.cachedRequestStoreData = null;

    // initialize buckets
    this.buckets = [];
    for (let i = 0; i < kademlia.constants.B; i += 1) {
      this.buckets.push(new Bucket(this));
    }
    // interval refresh
    this.nextRefreshTime = Date.now() + kademlia.constants.T_REFRESH;
    setInterval(() => {
      this.refreshIfNeed();
    }, kademlia.constants.T_REFRESH);

    return this;
  }
  // 取得指定node id應存放於此Node的哪一個bucket的index值。
  getBucketIndexOfNodeId(nodeId) {
    return kademlia.getBucketIndex(this.contact.id, nodeId);
  }
  // 將指定node id從此Node的bucket中移除
  // 移除成功時回傳true，否則回傳false。
  removeContactByNodeId(nodeId) {
    const shoultAtBucketIndex = this.getBucketIndexOfNodeId(nodeId);
    const bucket = this.buckets[shoultAtBucketIndex];
    this.storage
      .del(nodeId)
      .catch(doNothing);

    return bucket.remove(nodeId);
  }
  // 將指定contact更新到此Node的對應Bucket中。回傳Promise。
  setContact(newContact) {
    // 自己永遠不儲存自己
    if (newContact.id === this.contact.id) {
      return Promise.resolve(true);
    }
    const shoultAtBucketIndex = this.getBucketIndexOfNodeId(newContact.id);
    const bucket = this.buckets[shoultAtBucketIndex];

    return bucket.setContact(newContact);
  }
  // 對指定contact發出請求，若無法得到回應或者回應格式錯誤、驗證失敗，則自動移除該結點
  // 若能得到回應，則自動更新該結點
  request(contact, data) {
    const randomString = '' + (Math.floor(Math.random() * 9000) + 1000);
    const requestData = Object.assign({}, data, {
      random: randomString,
    });

    return new Promise((resolve, reject) => {
      this.transport.request(contact, requestData)
        .then((response) => {
          if (!response || !response.signature) {
            reject(new Error('response invalid!'));
          }
          const key = new NodeRSA();
          key.importKey(contact.publicKey, 'public');
          const signatureBuffer = Buffer.from(response.signature, 'base64');
          const signatureString = key.decryptPublic(signatureBuffer).toString('base64');
          if (signatureString !== randomString) {
            reject(new Error('response signature incorrect!'));
          }
          this.setContact(contact);

          resolve(response.data);
        })
        .catch(() => {
          this.removeContactByNodeId(contact.id);
        });
    });
  }
  requestFindNode(contact, nodeId) {
    const requestData = {
      type: 'FIND_NODE',
      data: nodeId,
    };

    return this.request(contact, requestData);
  }
  requestStore(contact) {
    if (!this.cachedRequestStoreData) {
      const stringifyData = JSON.stringify({
        id: this.contact.id,
        address: this.contact.address,
      });
      const bufferData = Buffer.from(stringifyData, 'utf8');
      const encryptBuffer = this.identity.key.encryptPrivate(bufferData);
      const encryptContact = Array.from(encryptBuffer);
      const { publicKey } = this.contact;
      this.cachedRequestStoreData = {
        type: 'STORE',
        data: {
          contact: encryptContact,
          publicKey,
        },
      };
    }

    return this.request(contact, this.cachedRequestStoreData);
  }
  // 試圖加入指定node contact並將自身contact資訊STORE到網路上。
  join(contact) {
    this.setContact(contact);

    return this.refresh();
  }
  // 處理其他node傳來request的方法
  handleRequest(data) {
    if (typeof data.random !== 'string' || data.random.length !== 4) {
      return Promise.reject(new Error('request random invalid!'));
    }
    let promise;
    switch (data.type) {
      case 'FIND_NODE': {
        promise = this.handleFindNode(data.data);
        break;
      }
      case 'STORE': {
        promise = this.handleStore(data.data);
        break;
      }
      default: {
        return Promise.reject(new Error('request type invalid!'));
      }
    }

    return new Promise((resolve, reject) => {
      promise
        .then((responseData) => {
          const randomBuffer = Buffer.from(data.random, 'base64');
          const signatureBuffer = this.identity.key.encryptPrivate(randomBuffer);
          const signature = signatureBuffer.toString('base64');
          const response = {
            data: responseData,
            signature,
          };

          return resolve(JSON.stringify(response));
        })
        .catch((e) => {
          return reject(e);
        });
    });
  }
  // 處理FIND_NODE request的方法
  handleFindNode(nodeId) {
    return new Promise((resolve, reject) => {
      if (Buffer.from(nodeId, 'hex').length !== kademlia.constants.B / 8) {
        return reject(new Error(`node id invalid!`));
      }
      // 若要尋找的就是自己，則返回之
      if (nodeId === this.contact.id) {
        return resolve([this.contact]);
      }
      return this.storage.get(nodeId)
        // 若能從storage中找到資料，則返回之
        .then((storagedContact) => {
          if (storagedContact && storagedContact.id === nodeId) {
            return resolve([storagedContact]);
          }

          throw new Error(`not found!`);
        })
        // 否則返回最接近的K個節點資料
        .catch(() => {
          return resolve(this.getClosestContactsToKey(nodeId, kademlia.constants.K));
        });
    });
  }
  // 處理STORE request的方法
  handleStore(data) {
    return new Promise((resolve, reject) => {
      const contact = this.parseStoreRequest(data);
      // 嘗試向需要儲存的結點發出FIND NODE request，成功request後才會真的儲存
      this.requestFindNode(contact, contact.id)
        .then(() => {
          return this.storage.put(contact.id, contact);
        })
        .then(resolve)
        .catch((error) => {
          reject(error);
        });
    });
  }
  // 驗證STORE request是否合法並將其中的contact資料解密、截取出來
  parseStoreRequest(data) {
    if (typeof data.publicKey !== 'string' || data.publicKey.length < 400 || data.publicKey.length > 1000) {
      throw new Error('invalid public key!');
    }
    if (!Array.isArray(data.contact) || data.contact.length > 1024 || data.contact.length < 256) {
      throw new Error('invalid public key!');
    }
    const key = new NodeRSA();
    key.importKey(data.publicKey, 'public');
    const decryptBuffer = key.decryptPublic(Buffer.from(data.contact));
    const contact = JSON.parse(decryptBuffer.toString('utf8'));
    if (contact.id !== sha224(data.publicKey)) {
      throw new Error('contact id is not match public key!');
    }
    contact.publicKey = data.publicKey;

    return contact;
  }
  // 在自身Bucket中尋找最靠近指定Node id的n個節點
  getClosestContactsToKey(id, n = kademlia.constants.K) {
    const closestBucketIndex = this.getBucketIndexOfNodeId(id);
    const closestBucket = this.buckets[closestBucketIndex];
    // reverse so the most recent communication node will at at first
    const closestContacts = closestBucket.contacts.slice().reverse();

    let descIndex = closestBucketIndex;
    let ascIndex = closestBucketIndex;
    while (closestContacts.length < n) {
      descIndex -= 1;
      ascIndex += 1;
      if (descIndex < 0 && ascIndex >= kademlia.constants.B) {
        break;
      }
      if (descIndex > 0) {
        const bucket = this.buckets[descIndex];
        // reverse so the most recent communication node will at at first
        const result = bucket.contacts.slice().reverse();
        closestContacts.push(...result);
      }
      if (ascIndex < kademlia.constants.B) {
        const bucket = this.buckets[ascIndex];
        // reverse so the most recent communication node will at at first
        const result = bucket.contacts.slice().reverse();
        closestContacts.push(...result);
      }
    }
    const sortedContacts = closestContacts.sort((contact1, contact2) => {
      return kademlia.compareKeyDistance(id, contact1.id, contact2.id);
    });

    return sortedContacts.slice(0, n);
  }
  // 若已有一段時間沒有搜尋任何結點，則以「搜尋一個隨機node id的contact」的行為來隨機蒐集、更新網路上的結點。
  refreshIfNeed() {
    if (Date.now() > this.nextRefreshTime) {
      return this.refresh();
    }

    return this;
  }
  // 以「搜尋一個隨機node id的contact」的行為來隨機蒐集、更新網路上的結點。
  // 之後向距離自身最近的K個結點發出STORE request
  refresh() {
    return this.searchSpecificNodeContact(kademlia.getRandomKey())
      .then(() => {
        // 取得距離自身最近的K個結點
        const closestContacts = this.getClosestContactsToKey(this.contact.id);
        const promiseList = closestContacts.map((contact) => {
          return this
            .requestStore(contact)
            .then((result) => {
              if (result) {
                return Promise.resolve(contact.id);
              }

              return Promise.resolve(false);
            });
        });

        return Promise.all(promiseList);
      });
  }
  // 尋找指定node id的contact，無論最後是否有找到，
  // 都會將搜索過程中接觸到的所有contact加入或更新bucket。
  // 會更新nextRefreshTime
  searchSpecificNodeContact(targetNodeId) {
    return new Promise((resolve, reject) => {
      // 先試圖從自己的storage中找尋是否有儲存資料
      this.storage.get(targetNodeId)
        // 若能從storage中找到資料，則返回之
        .then((storagedContact) => {
          if (storagedContact && storagedContact.id === targetNodeId) {
            return resolve(storagedContact);
          }

          throw new Error(`not found!`);
        })
        // 否則在整個網路上進行loop搜尋
        .catch(() => {
          // 更新nextRefreshTime
          this.nextRefreshTime = Date.now() + kademlia.constants.T_REFRESH;
          // 在自身已儲存在bucket裡的contacts中找到最接近的ALPHA個contact組成初始shortList
          const shortList = this.getClosestContactsToKey(targetNodeId, kademlia.constants.ALPHA);
          // 紀錄快查清單id set
          const shortListIdSet = new Set(shortList.map((contact) => {
            return contact.id;
          }));
          // 紀錄已經搜尋過的shord list index
          const checkedIndex = -1;

          // 開始loop搜尋。每次loop都是對目前shortList中所有尚未搜索過的contact node進行搜索行為
          this.loopSearch({
            targetNodeId,
            shortList,
            shortListIdSet,
            checkedIndex,
            resolve,
            reject,
          });
        });
    });
  }
  loopSearch(arg) {
    const {
      targetNodeId,
      shortList,
      shortListIdSet,
      resolve,
      reject,
    } = arg;
    let checkIndex = arg.checkedIndex + 1;
    // 若所有shortList中的結點皆已檢查過且未得出結果，則loop結束，返回undefined
    if (checkIndex >= shortList.length) {
      return resolve(undefined);
    }
    // 儲存搜索行為promise物件的陣列
    const searchActionList = [];
    // 對每個已放入shortList但尚未檢查的節點進行檢查
    for (; checkIndex < shortList.length; checkIndex += 1) {
      const unCheckedContact = shortList[checkIndex];
      // 如果該結點正是想要尋找到的contact，立刻回傳結果
      if (unCheckedContact.id === targetNodeId) {
        return resolve(unCheckedContact);
      }
      // 對該節點發出協尋要求
      const searchAction = this.requestFindNode(unCheckedContact, targetNodeId);
      // 將搜索行為放入searchActionList中
      searchActionList.push(searchAction);
    }

    // 待此輪loop的所有搜索行為執行完畢後，才會開始新的loop
    return Promise.all(searchActionList)
      .catch(doNothing)
      .then((requestResultList) => {
        requestResultList.forEach((requestResult) => {
          if (requestResult && requestResult.length) {
            requestResult.forEach((contact) => {
              // 將該contact尚不存在於shortList中
              if (!shortListIdSet.has(contact.id)) {
                shortListIdSet.add(contact.id);
                shortList.push(contact);
              }
            });
          }
        });
        this.loopSearch({
          targetNodeId,
          shortList,
          shortListIdSet,
          checkedIndex: checkIndex - 1,
          resolve,
          reject,
        });
      });
  }
}
module.exports = Node;

/**
 * 代表一個節點在網路上傳播的聯繫方式物件。
 * @typedef {Object} Contact
 * @property {string} id 表示該節點的唯一識別碼，Identity.id。
 * @property {string} publicKey 可發布到外界的公鑰字串。
 * @property {Address} address 可以訪問到該節點的地址陣列。
 */

/**
 * 網路上一個節點用來識別身份、簽署簽章的公私鑰集合物件。
 * @typedef {Object} Identity
 * @property {string} key NodeRSA私鑰物件。
 * @property {string} publicKey 可發布到外界的公鑰字串。
 * @property {string} id 對外界使用的身份識別碼，為公鑰的sha224字串。
 */

/**
 * 網路上可以訪問特定節點的地址陣列，一個節點可能會擁有多個可訪問地址。
 * @typedef {Array} Address
 * @property {string} 0 該節點的網路地址，可以是ip、domain name或TOR url。
 * @property {number|string} 1 該節點的訪問埠號。若該地址是TOR url，則固定為tor字串。
 */
