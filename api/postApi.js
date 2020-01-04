/**
 * @file postApi.js
 * @description Exposes all developed posts routes
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const router = require("express").Router();
const postModule = require("../modules/postModule");
const authenticatorMiddleware = require('./middleware').authenticate;

/**
 * Retrieves all post of a given user
 */
router.get('/user/:id/:page', authenticatorMiddleware, (req, res) => {
    let userId = req.params.id;
    let page = req.params.page;
    postModule.getPostsByUserId(userId, page).then((result) => {
        res.send(result);
    }).catch((err) => {
        console.log(err);
        res.sendStatus(500);
    })
});

/**
 * Subscribes a user to a given post
 */
router.post('/subscription', authenticatorMiddleware,(req, res) => {
    let userID = req.query.userID;
    let postID = req.query.postID;
    postModule.deletePostSubscription(userID, postID).then(() => {
        res.sendStatus(200);
    }).catch((err) => {
        console.log(err);
        res.sendStatus(500);
    })
});

/**
 * Deletes a given post
 */
router.delete('/:id', authenticatorMiddleware,(req, res) => {
    let postId = req.params.id;
    postModule.deletePostById(postId).then(() => {
        res.sendStatus(200);
    }).catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});

/**
 * Get posts by goal 
 */
router.get('/goal/:id', authenticatorMiddleware,(req, res) => {
    let goalId = req.params.id;
    postModule.getPostsByGoalId(goalId).then((result) => {
        res.send(result);
    }).catch((err) => {
        res.sendStatus(500);
    })
});

/**
 * Get all post for an array of goals
 */
router.post('/goals/:page', authenticatorMiddleware,(req, res) => {
    let goalsArr = req.body;
    let page = req.params.page;
    postModule.getPostsWithGoals(goalsArr, page).then((result) => {
        res.send(result);
    }).catch(() => {
        res.sendStatus(500);
    });
});

/**
 * Inserts a given post
 */
router.post('/', authenticatorMiddleware,(req, res) => {
    let postBody = req.body;
    postModule.insertPost(postBody.title, postBody.content, postBody.userID, postBody.goalId, postBody.base64Image, postBody.base64Video).then(() => {
        res.sendStatus(200);
    }).catch((err) => {
        console.log(err);
        res.sendStatus(500);
    })
});

/**
 * Deletes a comment
 */
router.delete('/comment/:id', authenticatorMiddleware,(req, res) => {
    let commentId = req.params.id;
    postModule.deleteCommentById(commentId).then(() => {
        res.sendStatus(200);
    }).catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});

/**
 * Retrieves comments for a given post
 */
router.get('/comments/:id',authenticatorMiddleware,(req, res) => {
    let postId = req.params.id;
    postModule.getCommentsByPostId(postId).then((result) =>{
        res.send(result);
    }).catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});

/**
 * Inserts a comment
 */
router.post('/comment', authenticatorMiddleware, (req, res) => {
    let body = req.body;
    postModule.insertCommentToPost(body.content, body.userID, body.postID).then((result) => {
        res.send(result);
    }).catch((err) => {
        res.sendStatus(err.errorCode);
    })
});



module.exports = router;