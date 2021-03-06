/**
 * @file postModule.js
 * @description Module for the post functions
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const db = require("../db/db");
const fileUtils = require("../modules/fileUtils");
const notificationModule = require('../modules/notificationModule');
const resultsPerPagePagination = 5;

module.exports = {

    
    /**
     * Inserts a post
     */
    insertPost: (title, content, userID, goalID, base64Image, base64Video) => {
        let postImageFilename = `${new Date().getMilliseconds()}_post.jpg`;
        let postVideoFilename = `${new Date().getMilliseconds()}_post.mp4`;
        if(base64Image){ // if post has image
            return fileUtils.saveImageFile(base64Image, postImageFilename).then((imageUrl) => {
                return  db.insertPost(title, content, userID, goalID, imageUrl).then(() => {
                    // send new post notification for users that have this goal id
                     notificationModule.sendNewPostNotification(goalID, userID);
                 });
             });
        }else if(base64Video){ //if post has video
            return fileUtils.saveVideoFile(base64Video, postVideoFilename).then((result) => {
                return  db.insertPost(title, content, userID, goalID, undefined, result.videoUrl, result.thumbnailUrl).then(() => {
                    notificationModule.sendNewPostNotification(goalID, userID);
                });
               
            });
        }else{ // if only text
            return  db.insertPost(title, content, userID, goalID).then(() => {
                notificationModule.sendNewPostNotification(goalID, userID);
            });
        }
    },

    /**
     * Gets post by goal id
     */
    getPostsByGoalId: (goalId) => {
        return db.getPostsByGoalId(goalId);
    },

    /**
     * Gets all posts that have a goal inside the goals list
     * @param {Array} goals 
     */
    getPostsWithGoals: (goals,page ) => {
        skip = page * resultsPerPagePagination
        return db.getPostsWithGoals(goals, skip, resultsPerPagePagination );
    },

    getTotalPagesWithGoals: (goals) => {
        return new Promise((resolve, reject) => {
            db.getTotalNumberOfPostsWithGoals(goals).then((total) => {
                resolve({
                    pages: Math.ceil(total[0].total / resultsPerPagePagination)
                })
            }).catch((err) => {
                console.log(err);
                reject();
            });
        })
    },

    /**
     * Gets post by user id
     */
    getPostsByUserId: (userId, page) => {
        skip = page * resultsPerPagePagination;
        return db.getPostsByUserId(userId, skip, resultsPerPagePagination);
    },

    getTotalPagesOfUserPosts: (id) => {
        return new Promise((resolve, reject) => {
            db.getTotalNumberOfPostsOfUser(id).then((total) => {
                resolve({
                    pages: Math.ceil(total[0].total / resultsPerPagePagination)
                })
            }).catch((err) => {
                console.log(err);
                reject();
            })
        });
    },

    /**
     * Inserts a comment into a post
     */
    insertCommentToPost: (content, commenterID, postID) => {
        return new Promise((resolve, reject) => {
            db.insertComment(commenterID, postID, content).then((result) => {
                // automatically subscribe the user to the post when he/she comments
                subscribeUserToPost(commenterID, postID);
                notificationModule.sendCommentNotificationForPostOwner(postID, commenterID);
                notificationModule.sendCommentNotificationForPostSubscribers(postID, commenterID);
                db.getLastInsertedComment().then((result) => {
                    resolve(result[0]);
                });
            }).catch((err) => {
                console.log(err);
                reject({
                    errorCode: 500
                })
            });
        });
    },

    /**
     * Gets all comments for a given post
     */
     getCommentsByPostId: (postID) => {
         return db.getCommentsByPostId(postID);
     },

     /**
      * Deletes a post
      */
     deletePostById: (postId) => {
        return db.deletePostById(postId);
     },

     /**
      * Deletes a comment
      */
     deleteCommentById: (commentId) => {
         return db.deleteCommentById(commentId);
     },

     /**
      * Delete the post's subscription a user is subscribed to
      */
     deletePostSubscription: (userID, postID) => {
        return db.deleteSubscriptionToPost(userID, postID);
     }

}

/**
 * Subscribes a user to a given post
 * @param {String} userID 
 * @param {String} postID 
 */
function subscribeUserToPost(userID, postID) {
    db.getUserPostSubscription(userID, postID).then((result) => {
        if(!result[0]){
            db.getPostById(postID).then((postResult) => {
                if(postResult[0].userID != userID){
                    db.subscribeUserToPost(userID, postID);
                }
            });
        }
    });
}