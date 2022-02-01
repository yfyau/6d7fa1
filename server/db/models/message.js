const Sequelize = require("sequelize");
const db = require("../db");

const Message = db.define("message", {
  text: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  senderId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  readed: {
    type: Sequelize.ARRAY(Sequelize.INTEGER),   // Array of userId who readed the message
    defaultValue: [],
  }
});

module.exports = Message;
