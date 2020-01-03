/**
 * @file middleware.js
 * @description Authentication middleware for the application. This middleware is used in
 * every HTTP request that requires authentication. An authenticated user is a user that
 * is registered within the application
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const db = require('../db/db');

module.exports = {
    authenticate: (req, res, next) => {
        let pushyToken = req.header('pushy');
        db.getUserByPushyToken(pushyToken).then((result) => {
            if(result[0])
                next(); // execute the http request
            else
                res.sendStatus(401); // token does not exist therefore user cant be authenticated
        })
    }
}