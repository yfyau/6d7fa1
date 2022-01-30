const router = require("express").Router();
const { User, Conversation, Message } = require("../../db/models");
const { Op } = require("sequelize");
const onlineUsers = require("../../onlineUsers");

// get all conversations for a user, include latest message text for preview, and all messages
// include other user model so we have info on username/profile pic (don't include current user info)
router.get("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }

    const userId = req.user.id;
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: {
          user1Id: userId,
          user2Id: userId,
        },
      },
      attributes: ["id", "user1LastReadMessageId", "user2LastReadMessageId"],
      order: [[Message, "createdAt", "ASC"]],
      include: [
        { model: Message, order: ["createdAt", "ASC"] },
        {
          model: User,
          as: "user1",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
        {
          model: User,
          as: "user2",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
      ],
    });

    for (let i = 0; i < conversations.length; i++) {
      const convo = conversations[i];
      const convoJSON = convo.toJSON();

      // set a property "otherUser" and "otherLastReadMessageId" so that frontend will have easier access
      if (convoJSON.user1) {
        convoJSON.otherUser = convoJSON.user1;
        delete convoJSON.user1;
        delete convoJSON.user2;

        convoJSON.lastReadMessageId = convoJSON.user2LastReadMessageId;
        convoJSON.otherLastReadMessageId = convoJSON.user1LastReadMessageId;
        delete convoJSON.user1LastReadMessageId;
        delete convoJSON.user2LastReadMessageId;
      } else if (convoJSON.user2) {
        convoJSON.otherUser = convoJSON.user2;
        delete convoJSON.user1;
        delete convoJSON.user2;

        convoJSON.lastReadMessageId = convoJSON.user1LastReadMessageId;
        convoJSON.otherLastReadMessageId = convoJSON.user2LastReadMessageId;
        delete convoJSON.user1LastReadMessageId;
        delete convoJSON.user2LastReadMessageId;
      }

      // set property for online status of the other user
      if (onlineUsers.includes(convoJSON.otherUser.id)) {
        convoJSON.otherUser.online = true;
      } else {
        convoJSON.otherUser.online = false;
      }

      // set properties for notification count and latest message preview
      convoJSON.unreadCount = 0;
      for (let i = convoJSON.messages.length - 1; i >= 0; i--) {
        if (convoJSON.messages[i].id === convoJSON.lastReadMessageId) break;
        if (convoJSON.messages[i].senderId !== userId) convoJSON.unreadCount++;
      }

      convoJSON.latestMessageText = convoJSON.messages[convoJSON.messages.length - 1].text;
      conversations[i] = convoJSON;
    }

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

// Update lastReadMessage for user1 / user2
router.post("/read", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const senderId = req.user.id;
    const { conversationId } = req.body;

    const convo = await Conversation.updateLastReadMessage(
      conversationId,
      senderId
    );

    res.json({
      conversationId: convo.id,
      lastReadMessageId: convo.user1Id == senderId ? convo.user1LastReadMessageId : convo.user2LastReadMessageId,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
