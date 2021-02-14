const fs = require("fs");
const MongoClient = require("mongodb");
const roomModel = require("./models/room");
const Promise = require("promise");

class DatabaseConnection {
  db = null;
  username = null;
  password = null;
  dbName = null;
  connectionString = null;
  client = null;
  roomID = null;

  constructor() {}

  readFile(fileName) {
    return new Promise((resolve, reject) => {
      fs.readFile(fileName, "utf8", function (error, data) {
        if (error) return reject(error);
        resolve(data);
      });
    });
  }

  async loadCredentials() {
    try {
      const data = await this.readFile("./db/creds.json");
      const fileData = JSON.parse(data);
      this.username = fileData.username;
      this.password = fileData.password;
      this.dbName = fileData.dbName;
      this.connectionString = `mongodb+srv://${this.username}:${this.password}@videochatcluster.iyq3a.mongodb.net/${this.dbName}?retryWrites=true&w=majority`;
      console.log(fileData, "defrgtrfefrgfergknfenfeknfenkfenkfeknefknfenkef");
      return Promise.resolve("success");
    } catch (e) {
      console.log("error loading credentials", e);
      return Promise.reject(err);
    }
  }

  async connectToMongoCluster() {
    try {
      await MongoClient.connect(this.connectionString, {
        useUnifiedTopology: true,
      }).then((client, err) => {
        if (err) {
          return Promise.reject(err);
        } else {
          console.log("Connected to Database");
          this.client = client;
          this.db = client.db("room");
          return Promise.resolve("connected");
        }
      });
    } catch (e) {
      console.log(e, "error connecting to db");
    }
  }

  async initialize() {
    try {
      await this.loadCredentials();
      await this.connectToMongoCluster();
    } catch (e) {
      console.log("there was a error setting up connection the cluster ");
    }
  }

  static async createInstance() {
    const clazz = new DatabaseConnection();
    await clazz.initialize();
    return clazz;
  }

  currentInstance() {
    return this.client;
  }

  toArray(iterator) {
    return new Promise((resolve, reject) => {
      iterator.toArray((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
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

  async insertUserRecord(user, roomId) {
    try {
      const collection = this.db.collection(roomId);
      await collection.insertOne(user);
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

  async findRecord(socketId) {
    try {
      const records = await this.toArray(
        this.db.collection(this.roomID).find({ socketId: socketId })
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

  async close() {
    this.db.close();
  }

  createChatRoom(roomID) {
    this.db.createCollection(roomID, roomModel);
  }
}

module.exports = DatabaseConnection;
