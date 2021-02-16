const DatabaseConnection = require("./Database");

class UserService {
  constructor() {}

  generateNewUserObject = (userId, socketId, isThereAnActiveRoom) => {
    return {
      peerId: userId,
      socketId: socketId,
      properties: {
        audioState: "unmuted",
        videoState: "playing",
      },
      isAdmin: !isThereAnActiveRoom ? true : false, //first user in room is admin by default
    };
  };
}
module.exports = UserService;
