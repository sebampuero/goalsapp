/**
 * @file chatsModule.js
 * @description Module for chat functions
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const db = require('../db/db');

module.exports = {

    /**
     * Creates a room between two users.
     * @param senderId {String} 
     * @param receiverId {String}
     */
    createRoom: (senderId, receiverId) => {
        return new Promise((resolve, reject) => {
            let users = [senderId, receiverId];
            let roomName = `${senderId}#${receiverId}`;
            insertRoomAndUsers(roomName, users).then((roomId) => {
                resolve({
                    roomName,
                    roomId
                });
            }).catch((err) => {
                console.log(err);
                reject();
            })
        });
    },

    /**
     * Checks if a room between two users exists.
     * @param senderId {String}
     * @param receiverId {String}
     */
    checkIfRoomBetweenUsersExist: (senderId, receiverId) => {
        return new Promise((resolve, reject) => {
            db.getRoomIdForUsers(senderId, receiverId).then((result) => {
                if (result[0]) {
                    resolve({
                        roomId: result[0].room_id,
                        room: result[0].roomName
                    })
                } else {
                    resolve();
                }
            }).catch((err) => {
                console.log(err);
                reject({
                    errorCode: 500
                });
            })
        })
    },

    /**
     * Get all chat rooms for a given user
     * @param userId {String}
     */
    getRoomsData: (userId) => {
        return db.getRoomsByUserId(userId);
    },

    /**
     * Get all chats messages for a chat room
     * @param {String} roomId
     */
    getChatsData: (roomId, page) => {
        let resultsPerPage = 20;
        let skip = page * resultsPerPage;
        return db.getChatsByRoomId(roomId, skip, resultsPerPage);
    },

    /**
     * Inserts a chat message into the db
     * @param {String} senderId
     * @param {String} roomId
     * @param {String} text 
     * @param {Boolean} otherClientInRoom true if the receiver is online, false otherwise
     */
    insertChatIntoDb: (senderId, roomId, text, otherClientInRoom) => {
        return new Promise((resolve, reject) => {
            db.insertChat(senderId, roomId, text).then(() => {
                if (otherClientInRoom)
                    resolve()
                else { // if there are clients in room no need to set the flag in the other end that there are new messages because
                    // the other client has the socket open and seeing new messages coming in
                    db.getReceiversInRoom(roomId, senderId).then((receiverResults) => {
                        db.setNewMessageInRoom(receiverResults, roomId, 1);
                        resolve();
                    })
                }
            }).catch(() => {
                reject();
            });
        });
    },

    /**
     * Sets the flag for messages read in a given chat room
     * @param {String} roomName 
     * @param {String} senderId
     */
    setChatRoomMessagesRead: (roomName, senderId) => {
        db.getRoomIdByName(roomName).then((roomId) => {
            db.setNewMessageInRoom([{id: senderId}], roomId[0].id, 0).then(() => { }).catch((err) => {
                console.log(err);
            });
        })
    },

    setLastOnline: (senderId, roomIId) => {
        return db.setLastOnlineForUser(senderId, roomIId);
    },

    getLastOnline: (userId, roomId) => {
        return db.getLastOnlineForUser(userId, roomId);
    },

    /**
     * Deletes a room
     * @param {String} roomId
     */
    deleteRoom: (roomId) => {
        return db.deleteRoom(roomId);
    },

    /**
     * Checks if the connected user is a registered user within the app
     * @param {String} pushyToken auth token
     */
    checkIfUserRegistered: (pushyToken) => {
        return new Promise((resolve, reject) => {
            db.getUserByPushyToken(pushyToken).then((result) => {
                if (result[0])
                    resolve();
                else
                    reject();
            })
        })
    },

    getRoomId: (roomName) => {
        return db.getRoomIdByName(roomName);
    }

}

/**
 * Inserts a newly created room for two users
 * @param {String} roomName 
 * @param {Array} users 
 */
function insertRoomAndUsers(roomName, users) {
    return new Promise((resolve, reject) => {
        db.insertRoom(roomName).then(() => {
            db.getLastCreatedRoom().then((roomResult) => {
                db.insertUsersIntoRoom(users, roomResult[0].id);
                resolve(roomResult[0].id)
            });
        });
    });
}