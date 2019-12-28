/**
 * @file goalModule.js
 * @description Module for the goal functions
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const db = require("../db/db");

module.exports = {
    
    /**
     * Retrieves the list of goals
     */
    getGoals: () => {
        return db.getListOfGoals();
    },

    /**
     * Inserts a goal request
     * @param {List} goals
     * @param {String} userID the user id requesting the goal
     */
    insertGoalRequest: (goals, userID) => {
        return new Promise((resolve, reject) => {
            db.insertGoalRequests(goals, userID);
            resolve();
        });
    }

}