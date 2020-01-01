/**
 * @file ioModule.js
 * @description Module for socket.io functions
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const chatModule = require('./chatsModule');
const notificationModule = require('./notificationModule');

const status = {
    ONLINE: 1,
    OFFLINE: 0
}

module.exports = {
    /**
     * Initializes the IO instance
     * @param {Object} server the server instance socket.io listens to
     */
    startIo: (server) => {
        const io = require('socket.io').listen(server);
        // the current room the client is talking to
        let currentRoom;
        // a mapping for socket.id (key) and if is allowed to chat (boolean)
        let socketsMapping = {};
        io.on('connection', (socket) => {
            console.log("Client connected ", socket.id);
            socketsMapping[socket.id] = false;
            socket.on('enterChat', (room, senderId, receiverId, pushyToken) => {
                chatModule.checkIfUserRegistered(pushyToken).then(() => {
                    // map this client to true, is authenticated
                    socketsMapping[socket.id] = true;
                    console.log(`${socket.id} entered with id ${senderId} to ${receiverId} with room ${room}`);
                    if (!room) {
                        chatModule.checkIfRoomBetweenUsersExist(senderId, receiverId).then((roomResult) => {
                            if (!roomResult) { // no room between users
                                chatModule.createRoom(senderId, receiverId).then((roomData) => {
                                    socket.join(roomData.roomName);
                                    socket.emit("room", roomData.roomName, roomData.roomId);
                                    chatModule.setChatRoomMessagesRead(roomData.roomName, senderId);
                                    console.log(`No room was available, room created ${roomData.roomName}`);
                                    currentRoom = roomData.roomName;
                                    // get last online of the receiver and transmit it to the sender
                                    chatModule.getLastOnline(receiverId, roomData.roomId).then((result) => {
                                        socket.emit("lastOnline", result[0].last_online);
                                    });
                                })
                            } else { // there is room, join user to room
                                console.log(`Room joined ${roomResult.room}`);
                                socket.join(roomResult.room);
                                socket.emit("room", roomResult.room, roomResult.roomId);
                                chatModule.setChatRoomMessagesRead(roomResult.room, senderId);
                                currentRoom = roomResult.room;
                                chatModule.getLastOnline(receiverId, roomResult.roomId).then((result) => {
                                    socket.emit("lastOnline", result[0].last_online);
                                });
                            }
                        })
                    } else {
                        console.log(`Room joined ${room}`);
                        socket.join(room);
                        chatModule.setChatRoomMessagesRead(room, senderId);
                        currentRoom = room;
                        chatModule.getRoomId(room).then((room_id) => { 
                            chatModule.getLastOnline(receiverId, room_id[0].id).then((result) => {
                                socket.emit("lastOnline", result[0].last_online);
                            });
                        });
                    }
                }).catch(() => {
                    console.log(`${socket.id} is not registered in the app, disconnecting`);
                    socketsMapping[socket.id] = false;
                    socket.disconnect();
                });
            });

            socket.on('clientStatusOnline', (room) => {
                if (socketsMapping[socket.id])
                    socket.broadcast.to(room).emit('status', status.ONLINE);
            });

            socket.on('typing', (room) => {
                if (socketsMapping[socket.id])
                    socket.broadcast.to(room).emit('isTyping');
            });

            socket.on('message', (userId, roomId, room, message) => {
                if (socketsMapping[socket.id]) {
                    let otherClientInRoom = false;
                    let clients;
                    if (io.sockets.adapter.rooms[currentRoom]) {
                        clients = io.sockets.adapter.rooms[currentRoom].sockets;
                        if (Object.keys(clients).length > 1)
                            otherClientInRoom = true;
                    }
                    if (!otherClientInRoom) // if the other user is NOT in the chat, send a push notification
                        notificationModule.sendMessageNotification(userId, room).catch(() => {
                            socket.emit('errorEvent');
                        });
                    chatModule.insertChatIntoDb(userId, roomId, message, otherClientInRoom).then(() => {
                        socket.broadcast.to(room).emit('message', roomId, userId, message, Math.floor(new Date() / 1000));
                    }).catch((err) => {
                        console.log(err);
                        socket.emit('errorEvent');
                    })
                }
            });

            socket.on('beforeDisconnect', (userId, roomId) => {
                // store the last online for this user before disconnecting
                if(socketsMapping[socket.id]){
                    chatModule.setLastOnline(userId, roomId).catch(() => {
                        socket.emit('errorEvent');
                    });
                }
            });

            socket.on('disconnect', () => {
                socket.broadcast.to(currentRoom).emit('status', status.OFFLINE);
                socketsMapping[socket.id] = false;
                console.log(`${socket.id} disconneted`);
            });
        });
    }
}