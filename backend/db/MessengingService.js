const DatabaseConnection = require("./Database");

class MessengingService extends DatabaseConnection {
  constructor(param1, param2) {
    super();
    this.initialize("Messages");
  }
}
module.exports = MessengingService;
