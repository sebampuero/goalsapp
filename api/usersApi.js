/**
 * @file api.js
 * @description Exposes all developed user routes
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const router = require("express").Router();
const userModule = require("../modules/userModule");
const authenticatorMiddleware = require('./middleware').authenticate;
const deviceAuthMiddleware = require('./middleware').authorizeUserAgent;

/**
 * Returns the user activity with id
 */
router.get('/userActivity/:id', authenticatorMiddleware, deviceAuthMiddleware, (req, res) => {
    let userId = req.params.id;
    userModule.getUserActivity(userId).then((activityResult) => {
        res.send(activityResult);
    }).catch(() => {
        res.sendStatus(500);
    })
});

/**
 * Returns a given status depending if email exists.
 */
router.get('/verifyEmail/:email', deviceAuthMiddleware, (req, res) => {
    let email = req.params.email;
    userModule.verifyEmailExists(email).then((result) => {
        if(result[0])
            res.sendStatus(400)
        else
            res.sendStatus(200);
    })
});

/**
 * Logs in a user. Does not require authentication
 */
router.post('/login', deviceAuthMiddleware, (req, res) => {
    let body = req.body;
    userModule.checkLogin(body.email, body.password).then((result) => {
        res.send(result);
    }).catch((err) => {
        res.sendStatus(err.errorCode)
    });
});

/**
 * Retrieves the details of a user
 */
router.get('/:id', authenticatorMiddleware, deviceAuthMiddleware, (req, res) => {
    let userId = req.params.id;
    userModule.getUserDetails(userId).then((result) => {
        res.send(result);
    }).catch((err) => {
        res.sendStatus(err.errorCode);
    });
});

/**
 * Updates information about a user
 */
router.post('/update', authenticatorMiddleware,deviceAuthMiddleware, (req, res) => {
    let body = req.body;
    userModule.updateUser(body.id, body.name, body.lastname, body.email, body.goals, body.goalTags, body.base64ProfilePic).then((result) => {
        res.send(result);
    }).catch((err) => {
        res.sendStatus(err.errorCode);
    })
});

/**
 * Updates the user`s password
 */
router.post('/update/password', authenticatorMiddleware,deviceAuthMiddleware, (req, res) => {
    let body = req.body;
    userModule.updateUserPassword(body.oldPassword, body.newPassword, body.userID).then((result) => {
		res.sendStatus(200);
	}).catch((err) => {
		res.send(err.errorCode);
	});
});

/**
 * Registers the user. Does not require authentication.
 */
router.post('/register',deviceAuthMiddleware, (req, res) => {
    let body = req.body;
    userModule.registerUser(body.name, body.lastname, body.email, body.password, body.goals, body.goalTags, body.pushyToken, body.pushyAuthKey, body.base64ProfilePic).then((result)=>{
        res.send(result);
    }).catch((err)=>{
        res.sendStatus(err.errorCode);
    });
});

module.exports = router;