/**
 * @file goalsApi.js
 * @description API for the goals application
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const router = require("express").Router();
const goalModule = require("../modules/goalModule");
const authenticatorMiddleware = require('./middleware').authenticate;

/**
 * Inserts a goal request
 */
router.post('/goal', authenticatorMiddleware, (req, res) => {
    let body = req.body;
    goalModule.insertGoalRequest(body.goals, body.userID).then(() => {
        res.sendStatus(200);
    });
});

/**
 * Retrieves the goals
 */
router.get('/' , (req, res) => {
    goalModule.getGoals().then((goals) => {
        res.send(goals);
    }).catch((err) => {
        console.log(err);
        res.sendStatus(500);
    })
});


module.exports = router;