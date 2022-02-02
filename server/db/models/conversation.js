const Sequelize = require("sequelize");
const { Op } = require("sequelize");
const db = require("../db");
const Message = require("./message");

const Conversation = db.define("conversation", {
  
});

// find conversation given two user Ids
/* TODO:  Update this function to support userIds
          Have to determine the comparsion logic (contains / fully equal)
*/
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
Conversation.updateLastReadMessage = async function (id, userId, time) {
  await Message.update({
    readed: Sequelize.fn('array_append', Sequelize.col('readed'), userId),
  }, {
    where: {
      conversationId: id,
      [Op.not]: {
        readed: {
          [Op.contains]: [userId]
        }
      },
      createdAt: {
        [Op.lte]: time
      }
    }
  });
};

Conversation.getUnreadCount = async function (id, userId) {
  const count = await Message.count({
    where: {
      conversationId: id,
      [Op.not]: {
        readed: {
          [Op.contains]: [userId]
        }
      },
    }
  });
  
  return count;
}

Conversation.getLastReadMessage = async function (id, userId) {
  const lastReadMessage = await Message.findOne({
    where:{ 
      conversationId: id,
      senderId: {
        [Op.not]: userId,
      },
      readed: {
        [Op.contains]: [userId]
      }
    },
    order: [["createdAt", "DESC"]]
  });

  return lastReadMessage;
}

module.exports = Conversation;
