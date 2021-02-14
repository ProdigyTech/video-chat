const DatabaseConnection = require("./Database");
const roomProperties = require("./models/roomProperties");

class RoomPropertiesService extends DatabaseConnection {
  constructor() {
    super();
    this.initialize("roomProperties");
  }

  createProperties(roomID) {
    this.db.createCollection(roomID, roomProperties);
  }
}

module.exports = RoomPropertiesService;
