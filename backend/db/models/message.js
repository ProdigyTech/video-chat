module.exports = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "message", "timestamp"],
      properties: {
        id: {
          bsonType: "string",
          description: "must be a string and is required",
        },
        message: {
          bsonType: ["string", "null"],
          description: "must be a string and is required",
        },
        unixTimestamp: {
          bsonType: ["string"],
          description: "must be a string and is required",
        },
        recalled: {
          bsonType: ["bool", "null"],
          description: "must be a string and is not required",
        },
        customName: {
          bsonType: ["string", "null"],
          description: "must be a string and is not required",
        },
      },
    },
  },
};
