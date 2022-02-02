const Sequelize = require("sequelize");
const { Op } = require("sequelize");
const db = require("../db");
const Message = require("./message");

const Conversation = db.define("conversation", {
  user1Id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  user2Id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  user1LastReadMessageId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  user2LastReadMessageId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  }
});

// find conversation given two user Ids

Conversation.findConversation = async function (user1Id, user2Id) {
  const conversation = await Conversation.findOne({
    where: {
      user1Id: {
        [Op.or]: [user1Id, user2Id]
      },
      user2Id: {
        [Op.or]: [user1Id, user2Id]
      }
    }
  });

  // return conversation or null if it doesn't exist
  return conversation;
};

// update lastReadMessage given conversation Id and user Id
// return null if conversation is not found or user is not match with the conversation
Conversation.updateLastReadMessage = async function (id, userId) {
  const conversation = await Conversation.findOne({
    where: { 
      id    
    } 
   });

   // Do nothing if conversation not found
   if (!conversation) return null;

   // Do nothing if userId is not in the conversation
   if (conversation.user1Id !== userId && conversation.user2Id !== userId) return null;

   const latestMessageIdByOther = await Message.findOne({
    where: {
      conversationId: id,
      senderId: {
        [Op.not]: userId
      }
    }, 
    order: [
      ["createdAt", "DESC"], 
      ["id", "DESC"]          // Handle for same createAt
    ],
   });

   // Do nothing if message not found
   if (!latestMessageIdByOther) return null;
   
   if (userId === conversation.user1Id) {
      await conversation.update({user1LastReadMessageId: latestMessageIdByOther.id});
   } else {
      await conversation.update({user2LastReadMessageId: latestMessageIdByOther.id});
   }

  return await conversation.save();
};

module.exports = Conversation;
