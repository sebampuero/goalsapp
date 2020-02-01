/**
 * @file api.js
 * @description Exposes all developed routes to the router object
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const router = require("express").Router();
const goalsApi = require("./goalsApi");
const usersApi = require('./usersApi');
const postsApi = require('./postApi');
const chatsApi = require('./chatsApi');
const notificationsApi = require('./notificationsApi');

router.use("/goals", goalsApi);
router.use("/users", usersApi);
router.use("/posts", postsApi);
router.use("/chats", chatsApi);
router.use("/notifications", notificationsApi);

module.exports = router;