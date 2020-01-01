/**
 * @file userModule.js
 * @description Module for the user functions
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const db = require("../db/db");
const crypto = require('crypto');
const fileUtils = require("../modules/fileUtils");

module.exports = {

    /**
     * Logs in a user with email and password
     * @param {String} email
     * @param {String} password 
     */
    checkLogin: (email, password) => {
        const hash = crypto.createHash('sha256');
        hash.update(password);
        let hashedPassword = hash.digest('hex');
        return new Promise((resolve, reject) => {
            db.loginUser(email).then((result) => {
                if (!result[0]) {
                    reject({ errorCode: 403 });
                    return;
                }
                if (email == result[0].email && hashedPassword == result[0].password) {
                    db.getGoalsByUserID(result[0].id).then((goalsResult) => {
                        resolve({
                            id: result[0].id,
                            name: result[0].name,
                            lastname: result[0].lastname,
                            email: result[0].email,
                            goals: goalsResult.map(row => row.id),
                            goalTags: goalsResult.map(row => row.tag),
                            profilePicUrl: result[0].profile_pic,
                            pushyToken: result[0].pushy_token,
                            pushyAuthKey: result[0].pushy_auth_key
                        });
                    });
                }
                else {
                    reject({
                        errorCode: 403
                    });
                }
            }).catch((err) => {
                console.log(err);
                reject({
                    errorCode: 500
                });
            });
        });
    },

    /**
     * Registers a user
     */
    registerUser: (name, lastname, email, password, goalIds, goals, pushyToken, pushyAuthKey, profilePicData) => {
        const hash = crypto.createHash('sha256');
        hash.update(password);
        let hashedPassword = hash.digest('hex');
        let profilePicFileName = `${email}_profile.jpg`;
        return new Promise((resolve, reject) => {
            fileUtils.saveImageFile(profilePicData, profilePicFileName).then((url) => { // upload profile pic if available
                db.insertUser(name, lastname, hashedPassword, email, pushyToken, pushyAuthKey, url).then(() => { 
                    db.getLastInsertedUser().then((result) => {
                        db.insertGoalsToUserID(goalIds, result[0].id);
                        resolve({
                            id: result[0].id,
                            name: result[0].name,
                            lastname: result[0].lastname,
                            email: result[0].email,
                            goals: goalIds,
                            goalTags: goals,
                            profilePicUrl: result[0].profile_pic,
                            pushyToken: result[0].pushy_token,
                            pushyAuthKey: result[0].pushy_auth_key
                        });
                    });
                }).catch((err) => {
                    console.log(err);
                    // throw error for when the given email address already exists in the db
                    if (err.code == "ER_DUP_ENTRY") {
                        reject({
                            errorCode: 400
                        });
                    } else {
                        reject({
                            errorCode: 500
                        });
                    }
                });
            })
        });
    },

    /**
     * Updates the user's info
     */
    updateUser: (id, name, lastname, email, goalIds, goals, profilePicData) => {
        return new Promise((resolve, reject) => {
            let filename = `${email}.jpg`
            fileUtils.saveImageFile(profilePicData, filename).then((imageUrl) => {
                db.updateUser(id, name, lastname, email, imageUrl).then(() => {
                    db.getUserById(id).then((result) => {
                        if (goalIds.length > 0) {
                            db.deleteGoalsFromUser(id);
                            db.insertGoalsToUserID(goalIds, result[0].id);
                        }
                        resolve({
                            id: result[0].id,
                            name: result[0].name,
                            lastname: result[0].lastname,
                            email: result[0].email,
                            goals: goalIds,
                            goalTags: goals,
                            profilePicUrl: result[0].profile_pic,
                            pushyToken: result[0].pushy_token,
                            pushyAuthKey: result[0].pushy_auth_key
                        });
                    })
                }).catch((err) => {
                    console.log(err);
                    if (err.code == "ER_DUP_ENTRY") {
                        reject({
                            errorCode: 400
                        });
                    } else {
                        reject({
                            errorCode: 500
                        });
                    }
                })
            })
        });
    },

    /**
     * Updates the user's password
     */
    updateUserPassword: (oldPassword, newPassword, userID) => {
        let hash = crypto.createHash('sha256');
        hash.update(oldPassword);
        let oldHashedPassword = hash.digest('hex');
        hash = crypto.createHash('sha256');
        hash.update(newPassword);
        let newHashedPassword = hash.digest('hex');
        return new Promise((resolve, reject) => {
            db.getHashedPasswordByUserId(userID).then((result) => {
                if (oldHashedPassword == result[0].password) {
                    db.updateUserPassword(userID, newHashedPassword);
                    resolve();
                } else {
                    reject({
                        errorCode: 400
                    });
                }
            }).catch((err) => {
                console.log(err);
                reject({
                    errorCode: 500
                });
            });
        });
    },

    /**
     * Retrieve user details by id
     */
    getUserDetails: (userId) => {
        return new Promise((resolve, reject) => {
            db.getUserById(userId).then((user) => {
                db.getGoalsByUserID(userId).then((goals) => {
                    resolve({
                        id: user[0].id,
                        name: user[0].name,
                        lastname: user[0].lastname,
                        email: user[0].email,
                        goalTags: goals.map(row => row.tag),
                        profilePicUrl: user[0].profile_pic
                    });
                }).catch((err) => {
                    console.log(err);
                    reject({
                        errorCode: 404
                    })
                })
            }).catch((err) => {
                console.log(err);
                reject({
                    errorCode: 500
                })
            })
        });
    },

    /**
     * Verifies if an email exists
     */
    verifyEmailExists: (email) => {
        return db.getUserIdByEmail(email);
    },

    /**
     * Returns the activity of a user. A user has for instance activity on a chat. If there are unread
     * messages, the chat activity is set to true. In the future, activity for notifications that weren't read
     * should be also retrieved.
     */
    getUserActivity: (userId) => {
        return new Promise((resolve, reject) => {
            db.getUserChatActivityById(userId).then((result) => {
                for(let i in result){
                    if(result[i].new_message == "1")
                        resolve({
                            chatActivity: true
                        });
                }
                resolve({
                    chatActivity: false
                });
            }).catch((err) => {
                console.log(err);
                reject();
            });
        })
    }
}