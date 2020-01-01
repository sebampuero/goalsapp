/**
 * @file notificationModule.js
 * @description Module for the notifications services
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const pushy = require("pushy");
const db = require("../db/db");
const notificationIds = {
    NEW_COMMENT_POST: 1,
    NEW_COMMENT_POST_SUBS: 2,
    NEW_POST: 3,
    NEW_MESSAGE: 4
}
const PUSHY_KEY = process.env.PUSHY_KEY;
const pushyAPI = new pushy(PUSHY_KEY);

module.exports = {

    /**
     * Send a notification for a new comment in a given post.
     * @param {String} postId 
     * @param {String} commentingUserId
     */
    sendCommentNotificationForPostOwner: (postId, commentingUserId) => {
        db.getUserById(commentingUserId).then((commentingUser) => { // get the commenter's info
            db.getUserByPostId(postId).then((postOwner) => { // get the post owner's info
                if (postOwner[0].pushy_token != commentingUser[0].pushy_token) {
                    let data = {
                        id: notificationIds.NEW_COMMENT_POST,
                        postId,
                        userName: commentingUser[0].name
                    }
                    let to = [postOwner[0].pushy_token];
                    let options = {}
                    executeNotificationSending(data, to, options);
                    db.insertNotification([postOwner[0].id], postId);
                }
            })
        });
    },

    /**
     * Send a comment notification for post subscribers in a given post
     * @param {String} postId
     * @param {String} commenterId
     */
    sendCommentNotificationForPostSubscribers: (postId, commenterId) => {
        db.getPostSubcribers(postId, commenterId).then((subscribersArr) => {
            db.getUserById(commenterId).then((commenterResult) => {
                let to = [];
                let userIds = [];
                for (let i = 0; i < subscribersArr.length; i++) {
                    to.push(subscribersArr[i].pushyToken);
                    userIds.push(subscribersArr[i].id);
                }
                let data = {
                    id: notificationIds.NEW_COMMENT_POST_SUBS,
                    postId,
                    commenterName: commenterResult[0].name
                }
                let options = {};
                if (to.length > 0) {
                    executeNotificationSending(data, to, options);
                    db.insertNotification(userIds, postId);
                }
            })
        });
    },

    /**
     * Send a new post notification for all users that have the post's goal
     * @param {String} goalId
     * @param {String} posterId
     */
    sendNewPostNotification: (goalId, posterId) => {
        db.getUserPushyTokensWithGoalId(goalId, posterId).then((result) => {
            let pushyTokens = [];
            let goalTag = result[0].tag;
            for (let index in result) {
                pushyTokens.push(result[index].pushy_token);
            }
            let data = {
                id: notificationIds.NEW_POST,
                newPostNotificationTag: goalTag
            }
            let to = pushyTokens;
            let options = {};
            executeNotificationSending(data, to, options);
        });
    },

    /**
     * Send a notification for a new message in a chat room
     * @param {String} senderId
     * @param {String} roomName 
     */
    sendMessageNotification: (senderId, roomName) => {
        return db.getRoomIdByName(roomName).then((roomResult) => { // get the room id
            return db.getUserById(senderId).then((userResult) => { // get the sender's data
                return db.getReceiversInRoom(roomResult[0].id, senderId).then((receiversResult) => { // get the receiver's data
                    let data = {
                        id: notificationIds.NEW_MESSAGE,
                        roomId: roomResult[0].id,
                        roomName,
                        senderName: userResult[0].name,
                        senderProfilePicUrl: userResult[0].profile_pic,
                        senderId: userResult[0].id
                    };
                    let to = [];
                    for(let i in receiversResult)
                        to.push(receiversResult[i].pushy_token);
                    let options = {};
                    executeNotificationSending(data, to, options);
                });
            });
        });
    }
}

/**
 * Sends a notification to the given destinataries using the Pushy service
 * @param {Object} data to send to the destinataries 
 * @param {Array} to destinataries pushy tokens 
 * @param {Object} options 
 */
function executeNotificationSending(data, to, options) {
    pushyAPI.sendPushNotification(data, to, options, (err, id) => {
        if (err)
            return console.log("Fatal error ocurred ", err);
    });
}