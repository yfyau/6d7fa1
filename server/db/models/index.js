const db = require("../db");

const Conversation = require("./conversation");
const User = require("./user");
const Message = require("./message");

// Create Join Table
const User_Conversation = db.define('User_Conversation');
User.belongsToMany(Conversation, {
  through: User_Conversation,
});
Conversation.belongsToMany(User, {
  through: User_Conversation,
});

Message.belongsTo(Conversation);
Conversation.hasMany(Message);

module.exports = {
  User,
  Conversation,
  Message
};
