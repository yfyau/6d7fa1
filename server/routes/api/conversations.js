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
      attributes: ["id"],
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
      } else if (convoJSON.user2) {
        convoJSON.otherUser = convoJSON.user2;
        delete convoJSON.user1;
        delete convoJSON.user2;
      }

      // set property for online status of the other user
      if (onlineUsers.includes(convoJSON.otherUser.id)) {
        convoJSON.otherUser.online = true;
      } else {
        convoJSON.otherUser.online = false;
      }

      // set properties for notification count and latest message preview
      convoJSON.unreadCount = await Conversation.getUnreadCount(convo.id, userId);
      const otherLastReadMessage = await Conversation.getLastReadMessage(convo.id, convoJSON.otherUser.id);
      convoJSON.otherLastReadMessageId = otherLastReadMessage?.id;

      convoJSON.latestMessageText = convoJSON.messages[convoJSON.messages.length - 1].text;
      conversations[i] = convoJSON;
    }

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

// Update lastReadMessage for user1 / user2
router.patch("/read", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }

    const senderId = req.user.id;
    const { conversationId } = req.body;

    const convo = await Conversation.findOne({
      where: {
        [Op.and]: {
          id: conversationId,
          [Op.or]: {
            user1Id: senderId,
            user2Id: senderId,
          }
        }
      }
    });

    if (convo == null) {
      return res.sendStatus(400);
    }

    await Conversation.updateLastReadMessage(
      conversationId,
      senderId,
      time,
    );

    const lastReadMessage = await Conversation.getLastReadMessage(
      conversationId,
      senderId,
    );

    res.json({
      conversationId: conversationId,
      lastReadMessageId: lastReadMessage.id,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
