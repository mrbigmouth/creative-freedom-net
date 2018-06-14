const { constants } = require('./kademlia');

/**
 * Router中用來容納contact的容器，每個Bucket最多可容納constants.K的contact。
 * @class
 */
class Bucket {
  constructor(node) {
    this.node = node;
    this.contacts = [];

    return this;
  }
  // 取得此Bucket是否還有空間可容納contact
  get hasSpace() {
    return this.contacts.length < constants.K;
  }
  // 依id取得contact在bucket中的索引位置
  indexOf(id) {
    return this.contacts.findIndex((existsContact) => {
      return existsContact.id === id;
    });
  }
  // 搜尋正選contact中是否存在指定id的contact，若有則返回contact，若無則返回undefined
  get(id) {
    return this.contacts.find((contact) => {
      return contact.id === id;
    });
  }
  // 依id移除contact，並從候補candidates contact中補入足夠的contact
  remove(id) {
    const existsIndex = this.indexOf(id);
    if (existsIndex >= 0) {
      this.contacts.splice(existsIndex, 1);

      return true;
    }

    return false;
  }
  // 檢查contact是否已存在於此bucket的contacts中，
  // 若存在，則更新該contact並將其順位移到尾端（代表最可靠、最近連接過的node）。
  // 若不存在且bucket仍有空間，則將該contact加到bucket前端。
  // 若不存在且bucket已無空間，則對此Bucket的首位contact發出request檢查，
  // 檢查成功時會更新首位contact至此bucket的尾端，並放棄new contact。
  // 檢查失敗時移除首位contact並將new contact加入至bucket中。
  // 加入成功時會回傳此contact目前位於此Bucket的index(大於等於0)。
  // 加入失敗時會回傳-1。
  setContact(newContact) {
    const existsContactIndex = this.contacts.findIndex((contact) => {
      return contact.id === newContact.id;
    });
    if (existsContactIndex !== -1) {
      this.contacts.splice(existsContactIndex, 1);
      this.contacts.push(newContact);

      return Promise.resolve(this.contacts.length - 1);
    }
    else if (this.hasSpace) {
      this.contacts.unshift(newContact);

      return Promise.resolve(0);
    }
    const firstContact = this.contacts[0];

    return this.node
      .request(firstContact, {
        type: 'FIND_NODE',
        data: firstContact.id,
      })
      .catch(() => {
        this.contacts.unshift(newContact);
      })
      .then(() => {
        return Promise.resolve(-1);
      });
  }
}
module.exports = Bucket;
