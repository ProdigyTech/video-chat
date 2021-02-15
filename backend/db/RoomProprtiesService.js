const DatabaseConnection = require("./Database");

const bcrypt = require("bcrypt");
const roomProperties = require("./models/roomProperties");

class RoomPropertiesService extends DatabaseConnection {
  constructor() {
    super();
    this.initialize("room_properties");
  }

  createProperties(roomID) {
    this.db.createCollection(roomID, roomProperties);
  }

  async insertNewProperties(roomID, properties) {
    try {
      const collection = this.db.collection(roomID);
      return await collection.insertOne(properties);
    } catch (e) {
      console.log(e);
    }
  }

  async getRoomInfo(roomID) {
    try {
      const records = await this.toArray(this.db.collection(roomID).find({}));
      return records;
    } catch (e) {
      console.log("error retriving recoords", e);
    }
  }

  async checkPassword(roomID, passedPassword) {
    try {
      const roomInfo = await this.getRoomInfo(roomID);
      if (roomID.length == 0) {
        return true;
      }
      const { isLocked, password: currentPassword, salt } = roomInfo[0];

      if (isLocked) {
        console.log(currentPassword);
        const isMatch =
          (await bcrypt.hash(passedPassword, salt)) == currentPassword;

        return isMatch;
      } else {
        return true;
      }
    } catch (e) {
      console.log("password check failed", e);
    }
  }

  async setPassword(roomID, password) {
    const salt = await bcrypt.genSalt(15);
    const pass = await bcrypt.hash(password, salt);

    try {
      return this.db.collection(roomID).updateOne(
        { id: roomID },
        {
          $set: {
            isLocked: true,
            password: pass,
            salt: salt,
          },
        }
      );
    } catch (e) {
      console.log("Error setting room password for", roomID, e);
    }
  }
}

module.exports = RoomPropertiesService;
