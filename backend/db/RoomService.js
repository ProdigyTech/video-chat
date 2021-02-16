const DatabaseConnection = require("./Database");
const roomModel = require("./models/room");

class RoomService extends DatabaseConnection {
  constructor() {
    super();
    this.initialize("rooms");
  }
  createChatRoom(roomID) {
    this.db.createCollection(roomID, roomModel);
  }

  async insertUserRecord(user, roomId) {
    try {
      const collection = this.db.collection(roomId);
      return await collection.insertOne(user);
    } catch (e) {
      console.log(e);
    }
  }

  async getConnectedUsers() {
    try {
      const records = await this.toArray(
        this.db.collection(this.roomID).find({})
      );
      return records;
    } catch (e) {
      console.log("error retriving recoords", e);
    }
  }

  updateUserBySocketId(socketId, attributeName, attributeValue) {
    try {
      return this.db.collection(this.roomID).updateOne(
        { socketId: socketId },
        {
          $set: {
            [attributeName]: attributeValue,
          },
        }
      );
    } catch (e) {
      console.log("could not update attribute ", e);
    }
  }

  async removeUserBySocketId(socketId) {
    try {
      return this.db.collection(this.roomID).deleteOne({ socketId: socketId });
    } catch (e) {
      console.log("error deleting user ", e);
    }
  }

  async deleteRoom() {
    try {
      return this.db.collection(this.roomID).deleteOne({});
    } catch (e) {
      console.log("error deleting room ", e);
    }
  }

  async doesRoomExist(roomId) {
    this.roomID = roomId;
    try {
      const collections = await this.toArray(this.db.listCollections());
      let room = collections.find((col) => col.name == roomId);
      return room ? true : false;
    } catch (e) {
      console.log("error checking for room", e);
    }
  }
}
module.exports = RoomService;
