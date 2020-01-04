/**
 * @file chatsApi.js
 * @description Exposes all developed chats routes
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const router = require("express").Router();
const chatsModule = require('../modules/chatsModule');
const authenticatorMiddleware = require('./middleware').authenticate;

/**
 * Retrieves the chat rooms of a given user
 */
router.get('/rooms/:id', authenticatorMiddleware, (req, res) => {
    let userId = req.params.id;
    chatsModule.getRoomsData(userId).then((rooms) => {
        res.send(rooms);
    }).catch((err) => {
        console.log(err);
        res.sendStatus(500);
    })
});

/**
 * Retrieves the chat messages of a chat room
 */
router.get('/:id/:page', authenticatorMiddleware, (req, res) => {
    let roomId = req.params.id;
    let page = req.params.page;
    chatsModule.getChatsForRoom(roomId, page).then((chats) => {
        res.send(chats);
    }).catch((err) => {
        console.log(err);
        res.sendStatus(500);
    })
});

router.get('/pagination/totalPages/:id', authenticatorMiddleware, (req, res) => {
    let roomId = req.params.id;
    chatsModule.getNumberOfPagesForChats(roomId).then((result) => {
        res.send(result.pages.toString());
    }).catch(() => {
        res.sendStatus(500);
    })
});

/**
 * Deletes a chat room
 */
router.delete('/:id', authenticatorMiddleware,(req, res) => {
    let roomId = req.params.id; 
    chatsModule.deleteRoom(roomId).then(() => {
        res.sendStatus(200);
    }).catch((err) =>{
        console.log(err);
        res.sendStatus(500);
    });
});

module.exports = router;