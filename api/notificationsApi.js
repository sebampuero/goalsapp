/**
 * @file notificationsApi.js
 * @description Exposes all developed notification routes
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 01.02.2020
 */

const router = require("express").Router();
const notificationModule = require("../modules/notificationModule");
const authenticatorMiddleware = require('./middleware').authenticate;

router.get('/user/:id/:page', authenticatorMiddleware, (req, res) => {
    let userId = req.params.id;
    let page = req.params.page;
    notificationModule.getNotificationsForUser(userId, page).then((result) => {
        res.send(result);
    }).catch((error) => {
        console.log(error);
        res.sendStatus(500);
    })
});

router.get('/user/pagination/totalPages/:id', authenticatorMiddleware, (req, res) => {
    let userId = req.params.id;
    notificationModule.getTotalNumberOfNotifications(userId).then((result) => {
        res.send(result.pages.toString());
    }).catch(() => {
        res.sendStatus(500);
    })
});

module.exports = router;