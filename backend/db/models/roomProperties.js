module.exports = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["isLocked", "password", "salt", "id"],
      properties: {
        isLocked: {
          bsonType: "bool",
          description: "must be a bool and is required",
        },
        password: {
          bsonType: ["string", "null"],
          description: "must be a string and is required",
        },
        salt: {
          bsonType: ["string", "null"],
          description: "must be a string and is required",
        },
        id: {
          bsonType: ["string"],
          description: "must be a string and is required",
        },
      },
    },
  },
};
