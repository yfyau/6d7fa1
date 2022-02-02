import io from "socket.io-client";
import store from "./store";
import {
  setNewMessage,
  setMessageRead,
  removeOfflineUser,
  addOnlineUser,
} from "./store/conversations";

const socket = io(window.location.origin);

socket.on("connect", () => {
  console.log("connected to server");

  socket.on("add-online-user", (id) => {
    store.dispatch(addOnlineUser(id));
  });

  socket.on("remove-offline-user", (id) => {
    store.dispatch(removeOfflineUser(id));
  });

  socket.on("new-message", (data) => {
    store.dispatch(setNewMessage(data.message, data.sender));
  });

  socket.on("update-last-read-message", (data) => {
    store.dispatch(setMessageRead(data.conversationId, data.lastReadMessageId));
  })
});

export default socket;
