const DatabaseConnection = require("./Database");
const messageModel = require("./models/message");
const uuidv = require("uuid").v4;

class MessengingService extends DatabaseConnection {
  constructor(param1, param2) {
    super();
    this.initialize("messages");
  }

  createMessageStore(roomId) {
    this.db.createCollection(roomId, messageModel);
  }

  async recallMessage(id, roomId) {
    try {
      return this.db.collection(roomId).updateOne(
        { id: id },
        {
          $set: {
            recalled: true,
          },
        }
      );
    } catch (e) {
      console.log("could not update attribute ", e);
    }
  }

  async getAllMessagesForRoom(roomId) {
    try {
      return await this.toArray(this.db.collection(roomId).find({}));
    } catch (e) {
      console.log(e);
    }
  }

  composeNewMessage(socketId, message, customName = null) {
    let currentTime = this.getTimeStamp();
    return {
      id: uuidv(),
      message: message,
      from: socketId,
      timestamp: `${currentTime.getHours()}:${currentTime.getMinutes()}`,
      unixTimestamp: `${currentTime}`,
      recalled: false,
      customName: customName,
    };
  }
  async storeMessage(messageObj, roomId) {
    console.log(messageObj);
    try {
      const collection = this.db.collection(roomId);
      return await collection.insertOne(messageObj);
    } catch (e) {
      console.log("error storing message", e);
    }
  }
  getTimeStamp() {
    return new Date(Date.now());
  }
}
module.exports = MessengingService;
