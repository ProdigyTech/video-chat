module.exports = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["peerId", "socketId", "properties", "isAdmin"],
      properties: {
        peerId: {
          bsonType: "string",
          description: "must be a string and is required",
        },
        socketId: {
          bsonType: "string",
          description: "must be a string and is required",
        },
        properties: {
          bsonType: "object",
          description: "must be a object and is required",
        },
        isAdmin: {
          bsonType: "bool",
          description: "must be a boolean and is required",
        },
        customName: {
          bsonType: "string",
          description: "must be a string and is optional",
        },
      },
    },
  },
};
