module.exports = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["isLocked", "password", "salt"],
      properties: {
        isLocked: {
          bsonType: "bool",
          description: "must be a bool and is required",
        },
        password: {
          bsonType: "string",
          description: "must be a string and is required",
        },
        salt: {
          bsonType: "string",
          description: "must be a string and is required",
        },
      },
    },
  },
};
