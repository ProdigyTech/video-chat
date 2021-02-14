const fs = require("fs");
const MongoClient = require("mongodb");
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
      const data = await this.readFile("./backend/db/creds.json");
      const fileData = JSON.parse(data);
      this.username = fileData.username;
      this.password = fileData.password;
      this.dbName = fileData.dbName;
      this.connectionString = `mongodb+srv://${this.username}:${this.password}@videochatcluster.iyq3a.mongodb.net/${this.dbName}?retryWrites=true&w=majority`;
      return Promise.resolve("success");
    } catch (e) {
      console.log("error loading credentials", e);
      return Promise.reject(err);
    }
  }

  async connectToMongoCluster(db) {
    try {
      await MongoClient.connect(this.connectionString, {
        useUnifiedTopology: true,
      }).then((client, err) => {
        if (err) {
          return Promise.reject(err);
        } else {
          console.log("Connected to Database");
          this.client = client;
          this.db = client.db(db);
          return Promise.resolve("connected");
        }
      });
    } catch (e) {
      console.log(e, "error connecting to db");
    }
  }

  async initialize(db) {
    try {
      await this.loadCredentials();
      await this.connectToMongoCluster(db);
    } catch (e) {
      console.log("there was a error setting up connection the cluster ");
    }
  }
  //connects to test db by default
  static async createInstance(db = "test") {
    const clazz = new DatabaseConnection();
    await clazz.initialize(db);
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

  async findRecord(record) {
    try {
      const records = await this.toArray(
        this.db.collection(this.roomID).find(record)
      );
      return records;
    } catch (e) {
      console.log("error retriving recoords", e);
    }
  }

  async close() {
    this.db.close();
  }
}

module.exports = DatabaseConnection;
