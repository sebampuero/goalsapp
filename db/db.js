/**
 * @file db.js
 * @description Contains CRUD Functions to interact with the mysql database
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const mysql = require('mysql');
const sqlHost = "remotemysql.com"; //"remotemysql.com"
const DB_PASSWORD = process.env.DB_PASSWORD;

const dbUser = {
    username: "1gIpVm2rEi",
    password: DB_PASSWORD 
}

var conn;

function handleDisconnect() {
    conn = mysql.createConnection({
        host: sqlHost,
        port: 3306,
        user: dbUser.username,
        password: dbUser.password,
        database: "1gIpVm2rEi",
        charset : 'utf8mb4'
    });

    conn.connect(function (err) {
        if (err) {
            throw err;
        }
        console.log("Connection to MySQL successful");
    });

    conn.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}
handleDisconnect();

module.exports = {

    // USER

    loginUser: (email) => {
        let sqlStmt = `SELECT id,email,name,lastname,password,profile_pic,pushy_token,pushy_auth_key FROM user WHERE email like ${conn.escape(email)}`;
        return sendQuery(sqlStmt);
    },

    getUserIdByEmail: (email) => {
        let sqlStmt = `SELECT id FROM user WHERE email like ${conn.escape(email)} `;
        return sendQuery(sqlStmt);
    },

    updateUser: (userID, name, lastname, email, profilePicUrl) => {
        let sqlStmt = "";
        if (profilePicUrl)
            sqlStmt = `UPDATE user 
				SET name=${conn.escape(name)}, lastname=${conn.escape(lastname)}, email=${conn.escape(email)}, profile_pic=${conn.escape(profilePicUrl)}
                WHERE id = ${conn.escape(userID)}`;
        else
            sqlStmt = `UPDATE user 
				SET name=${conn.escape(name)}, lastname=${conn.escape(lastname)}, email=${conn.escape(email)}
				WHERE id = ${conn.escape(userID)}`;
        return sendQuery(sqlStmt);
    },

    updateUserPassword: (userID, password) => {
        let sqlStmt = `UPDATE user SET password=${conn.escape(password)} WHERE id = ${conn.escape(userID)}`;
        sendQuery(sqlStmt);
    },

    getHashedPasswordByUserId: (userID) => {
        let sqlStmt = `SELECT password FROM user WHERE id = ${conn.escape(userID)}`;
        return sendQuery(sqlStmt);
    },

    getUserById: (id) => {
        let sqlStmt = `SELECT * FROM user WHERE id = ${conn.escape(id)}`;
        return sendQuery(sqlStmt);
    },

    insertUser: (name, lastname, hashedPassword, email, pushyToken, pushyAuthKey, profilePicUrl) => {
        let sqlStmt = (profilePicUrl) ?  `INSERT INTO user(name, lastname, password, email, pushy_token, pushy_auth_key, profile_pic) 
            VALUES(${conn.escape(name)}, ${conn.escape(lastname)}, ${conn.escape(hashedPassword)}, ${conn.escape(email)}, ${conn.escape(pushyToken)}, ${conn.escape(pushyAuthKey)}, ${conn.escape(profilePicUrl)})` :
            `INSERT INTO user(name, lastname, password, email, pushy_token, pushy_auth_key) 
			VALUES(${conn.escape(name)}, ${conn.escape(lastname)}, ${conn.escape(hashedPassword)}, ${conn.escape(email)}, ${conn.escape(pushyToken)}, ${conn.escape(pushyAuthKey)})`;
        return sendQuery(sqlStmt);
    },

    getLastInsertedUser: () => {
        let sqlStmt = `SELECT id, name, lastname, email, profile_pic FROM user WHERE id = LAST_INSERT_ID()`;
        return sendQuery(sqlStmt);
    },

    saveOrUpdatePushyToken: (userId, token) => {
        let sqlStmt = `UPDATE user SET pushy_token=${conn.escape(token)} WHERE id =${conn.escape(userId)}`;
        return sendQuery(sqlStmt);
    },

    getUserByPostId: (postId) => {
        let sqlStmt = `SELECT u.name, u.lastname, u.email, u.pushy_token, u.id FROM post p INNER JOIN user u ON p.userID = u.id WHERE p.id = ${postId}`;
        return sendQuery(sqlStmt);
    },

    getTokenAndAuth: (userId) => {
        let sqlStmt = `SELECT pushy_token, pushy_auth_key FROM user WHERE id = ${conn.escape(userId)}`;
        return sendQuery(sqlStmt);
    },

    getUserPushyTokensWithGoalId: (goalId, posterId) => {
        let sqlStmt = `SELECT u.pushy_token, g.tag FROM goals_users gu 
            INNER JOIN user u 
            ON u.id = gu.user_id
            INNER JOIN goal g 
            ON g.id = gu.goal_id
            WHERE gu.goal_id =${conn.escape(goalId)} AND gu.user_id != ${conn.escape(posterId)}`;
        return sendQuery(sqlStmt);
    },

    getUserEmailById: (userId) => {
        let sqlStmt = `SELECT email FROM user WHERE id = ${conn.escape(userId)}`;
        return sendQuery(sqlStmt);
    },

    getUserByPushyToken: (pushyToken) => {
        let sqlStmt = `SELECT id FROM user WHERE pushy_token like ${conn.escape(pushyToken)}`;
        return sendQuery(sqlStmt);
    },


    // POST

    insertPost: (title, content, userID, goalID, pictureUrl, videoUrl, thumbnailUrl) => {
        let sqlStmt;
        if(pictureUrl)
            sqlStmt = `INSERT INTO post(title, content, userID, goalID, timestamp, picture)
                VALUES(${conn.escape(title)}, ${conn.escape(content)}, ${userID}, ${goalID}, UNIX_TIMESTAMP(), ${conn.escape(pictureUrl)})`;
        else if(videoUrl)
            sqlStmt = `INSERT INTO post(title, content, userID, goalID, timestamp, video, video_thumbnail)
                VALUES(${conn.escape(title)}, ${conn.escape(content)}, ${userID}, ${goalID}, UNIX_TIMESTAMP(), ${conn.escape(videoUrl)}, ${conn.escape(thumbnailUrl)})`;
        else
            sqlStmt = `INSERT INTO post(title, content, userID, goalID, timestamp)
                VALUES(${conn.escape(title)}, ${conn.escape(content)}, ${userID}, ${goalID}, UNIX_TIMESTAMP())`;
        return sendQuery(sqlStmt);
    },

    getPostById: (postId) => {
        let sqlStmt = `SELECT * FROM post WHERE id =${conn.escape(postId)}`;
        return sendQuery(sqlStmt);
    },

    getPostsWithGoals: (goals,skip, resultsPerPage) => {
        let sqlStmt = `SELECT p.id, u.id as userID, u.name, u.lastname, p.title, p.content, p.timestamp, u.profile_pic as posterPicUrl, p.picture as contentPicUrl,
        (SELECT tag FROM goal WHERE id = p.goalID) as goalTag, (SELECT COUNT(*) FROM comment WHERE postID = p.id) as commentCount, 
        (SELECT GROUP_CONCAT(user_id,",") FROM post_subscription WHERE post_id = p.id) as subscriberIds, p.video as contentVideoUrl, p.video_thumbnail as contentVideoThumbnailUrl
            FROM post p 
            JOIN user u 
            ON p.userID = u.id 
            WHERE p.goalID IN (${conn.escape(goals)})
            ORDER BY p.timestamp DESC LIMIT ${conn.escape(skip)}, ${conn.escape(resultsPerPage)}`;
        return sendQuery(sqlStmt);
    },

    getPostsByUserId: (id, skip, resultsPerPage) => {
        let sqlStmt = `SELECT p.id, u.id as userID, p.title, p.content, p.timestamp, (SELECT tag FROM goal WHERE id = p.goalID) as goalTag, u.name, u.lastname, u.profile_pic as posterPicUrl, p.picture as contentPicUrl,
                (SELECT COUNT(*) FROM comment WHERE postID = p.id) as commentCount, (SELECT GROUP_CONCAT(user_id,",") FROM post_subscription WHERE post_id = p.id) as subscriberIds, p.video as contentVideoUrl, p.video_thumbnail as contentVideoThumbnailUrl
            FROM post p 
            INNER JOIN user u
            ON p.userID = u.id
            WHERE u.id = ${conn.escape(id)}
            ORDER BY p.timestamp DESC LIMIT ${conn.escape(skip)}, ${conn.escape(resultsPerPage)}`;
        return sendQuery(sqlStmt);
    },

    deletePostById: (postId) => {
        let sqlStmt = `DELETE FROM post WHERE id = ${conn.escape(postId)}`;
        return sendQuery(sqlStmt);
    },

    getUserPostSubscription: (userID, postID) =>  {
        let sqlStmt = `SELECT * FROM post_subscription WHERE user_id = ${conn.escape(userID)} AND post_id = ${conn.escape(postID)}`;
        return sendQuery(sqlStmt);
    },

    subscribeUserToPost: (userID, postID) => {
        let sqlStmt = `INSERT INTO post_subscription(user_id, post_id) VALUES (${conn.escape(userID)}, ${conn.escape(postID)})`;
        return sendQuery(sqlStmt);
    },

    getPostSubcribers: (postID, commenterId) => {
        let sqlStmt = `SELECT u.pushy_token as pushyToken, u.id
            FROM post_subscription ps
            INNER JOIN user u 
            ON ps.user_id = u.id
            INNER JOIN post p
            ON ps.post_id = p.id
            WHERE p.id = ${conn.escape(postID)} AND u.id != ${conn.escape(commenterId)}`;
        return sendQuery(sqlStmt);
    },

    deleteSubscriptionToPost: (userID, postID) => {
        let sqlStmt = `DELETE FROM post_subscription WHERE user_id = ${conn.escape(userID)} AND post_id = ${conn.escape(postID)}`;
        return sendQuery(sqlStmt);
    },


    // NOTIFICATIONS

    insertNotification: (userIds, postId) => {
        let sqlStmt = `INSERT INTO notifications(user_id, post_id, timestamp) VALUES`;
        for(let i = 0; i < userIds.length; i++){
            if(i != userIds.length - 1)
                sqlStmt = sqlStmt + `(${conn.escape(userIds[i])}, ${conn.escape(postId)}, UNIX_TIMESTAMP()),`
            else if(i == userIds.length - 1)
                sqlStmt = sqlStmt + `(${conn.escape(userIds[i])}, ${conn.escape(postId)}, UNIX_TIMESTAMP());`
        }
        return sendQuery(sqlStmt);
    },

    getNotificationsByUserId: (userId, skip, resultsPerPage) => {
        let sqlStmt = `SELECT post_id as postId, timestamp
            FROM notifications
            WHERE user_id = ${conn.escape(userId)}
            ORDER BY timestamp DESC LIMIT ${conn.escape(skip)}, ${conn.escape(resultsPerPage)}`;
        return sendQuery(sqlStmt);
    },


    //COMMENT

    insertComment: (userID, postID, content) => {
        let sqlStmt = `INSERT INTO comment(content, userID, postID, timestamp)
			VALUES(${conn.escape(content)}, ${conn.escape(userID)}, ${conn.escape(postID)}, UNIX_TIMESTAMP())`;
        return sendQuery(sqlStmt);
    },

    getCommentById: (commentId) => {
        let sqlStmt = `SELECT * FROM comment WHERE id = ${conn.escape(commentId)}`;
        return sendQuery(sqlStmt);
    },

    getLastInsertedComment: () => {
        let sqlStmt = `SELECT c.content, u.name, u.lastname, c.timestamp, u.id as userID, u.profile_pic as commentatorPicUrl
            FROM comment c INNER JOIN user u 
            ON c.userID = u.id WHERE c.id = LAST_INSERT_ID()`;
        return sendQuery(sqlStmt);
    },

    getCommentsByPostId: (postId) => {
        let sqlStmt = `SELECT c.id, c.content, u.name, u.lastname, c.timestamp, u.id as userID, u.profile_pic as commentatorPicUrl 
            FROM comment c 
            INNER JOIN post p ON c.postID = p.id 
            INNER JOIN user u ON u.id = c.userID 
            WHERE p.id = ${conn.escape(postId)}`;
        return sendQuery(sqlStmt);
    },

    deleteCommentById: (commentId) => {
        let sqlStmt = `DELETE FROM comment WHERE id =${conn.escape(commentId)}`;
        return sendQuery(sqlStmt);
    },


    // GOAL

    insertGoalRequests: (tags, userID) => {
        let sqlStmt;
        for (let i in tags) {
            sqlStmt = `INSERT INTO goal_request(request_tag, accepted, requester_id) 
                        VALUES(${conn.escape(tags[i])}, false, ${conn.escape(userID)})`;
        }
        sendQuery(sqlStmt);
    },

    getGoalsByUserID: (userID) => {
        let sqlStmt = `SELECT g.id, g.tag FROM goal g 
			INNER JOIN goals_users gu ON g.id = gu.goal_id 
			INNER JOIN user u ON u.id = gu.user_id WHERE u.id = ${conn.escape(userID)}`;
        return sendQuery(sqlStmt);
    },

    getListOfGoals: () => {
        let sqlStmt = `SELECT * FROM goal`;
        return sendQuery(sqlStmt);
    },

    insertGoalsToUserID: (goals, userID) => {
        let sqlStmt;
        for (let i = 0; i < goals.length; i++) {
            sqlStmt = `INSERT INTO goals_users(user_id, goal_id) VALUES(${conn.escape(userID)}, ${conn.escape(goals[i])})`;
            sendQuery(sqlStmt);
        }
    },

    deleteGoalsFromUser: (userID) => {
        let sqlStmt = `DELETE FROM goals_users WHERE user_id = ${conn.escape(userID)}`;
        sendQuery(sqlStmt);
    },

    // CHATS

    insertRoom: (roomName) => {
        let sqlStmt = `INSERT INTO room(room, last_timestamp) 
            VALUES(${conn.escape(roomName)}, UNIX_TIMESTAMP())`;
        return sendQuery(sqlStmt);
    },


    getLastCreatedRoom: () => {
        let sqlStmt = `SELECT * FROM room WHERE id = LAST_INSERT_ID()`;
        return sendQuery(sqlStmt);
    },

    insertUsersIntoRoom: (users, roomId) => {
        let sqlStmt = "INSERT INTO rooms_user(user_id, room_id) VALUES";
        for(let i = 0; i < users.length; i++){
            if(i != users.length - 1)
                sqlStmt = sqlStmt + `(${conn.escape(users[i])}, ${conn.escape(roomId)}),`
            else if(i == users.length - 1)
                sqlStmt = sqlStmt + `(${conn.escape(users[i])}, ${conn.escape(roomId)});`
        }
        return sendQuery(sqlStmt);
    },

    getRoomById: (roomId) => {
        let sqlStmt = `SELECT * FROM room WHERE id =${conn.escape(roomId)}`;
        return sendQuery(sqlStmt);
    },

    getRoomIdByName: (roomName) =>  {
        let sqlStmt = `SELECT id FROM room WHERE room like ${conn.escape(roomName)}`;
        return sendQuery(sqlStmt);
    },

    getRoomsByUserId: (userId) => {
        let sqlStmt = `SELECT other.otherId AS receiverId, other.Img as profilePic, 
                other.otherName as receiverName, r.id, r.room, r.last_timestamp as lastTimestamp, ru.new_message as newMessageInRoom, ru.last_online as lastOnline
            FROM room r
            INNER JOIN rooms_user ru
            ON ru.room_id = r.id
            INNER JOIN user u 
            ON u.id = ru.user_id
            JOIN
                (SELECT u.id AS otherId, u.profile_pic AS Img, u.name AS otherName, ru.room_id AS roomId 
                FROM user u 
                INNER JOIN rooms_user ru 
                ON ru.user_id = u.id) other
            ON other.roomId = ru.room_id
            WHERE u.id = ${conn.escape(userId)} AND other.otherId != ${conn.escape(userId)}`
        return sendQuery(sqlStmt);
    },

    getChatsByRoomId: (roomId, skip, resultsPerPage) => {
        let sqlStmt = `SELECT cm.id AS chatId, timestamp, text, room_id as roomId, user_id as senderId
            FROM chat_message cm
            INNER JOIN room r
            ON r.id = cm.room_id
            WHERE r.id = ${conn.escape(roomId)}
            ORDER BY timestamp DESC LIMIT ${conn.escape(skip)}, ${conn.escape(resultsPerPage)}`;
        return sendQuery(sqlStmt);
    },

    insertChat: (userId, roomId,  text) => {
        let sqlStmt = `INSERT INTO chat_message(timestamp, text, room_id, user_id) 
            VALUES(UNIX_TIMESTAMP(), ${conn.escape(text)}, ${conn.escape(roomId)}, ${conn.escape(userId)})`;
        let sqlStmt2 = `UPDATE room SET last_timestamp = UNIX_TIMESTAMP() WHERE id = ${conn.escape(roomId)}`;
        return Promise.all([sendQuery(sqlStmt), sendQuery(sqlStmt2)])
    },

    // 0 -> read, 1 -> new messages
    setNewMessageInRoom: (userId, roomId, value) => {
        let sqlStmt = `UPDATE rooms_user SET new_message=${conn.escape(value)} 
            WHERE user_id = ${conn.escape(userId)} AND room_id = ${conn.escape(roomId)}`;
        return sendQuery(sqlStmt);
    },

    setLastOnlineForUser: (userId, roomId) => {
        let sqlStmt = `UPDATE rooms_user 
            SET last_online=UNIX_TIMESTAMP() 
            WHERE user_id = ${conn.escape(userId)} AND room_id = ${conn.escape(roomId)}`;
        return sendQuery(sqlStmt);
    },

    getLastOnlineForUser: (userId, roomId) => {
        let sqlStmt = `SELECT last_online FROM rooms_user WHERE user_id = ${conn.escape(userId)} AND room_id = ${conn.escape(roomId)}`;
        return sendQuery(sqlStmt);
    },

    getReceiverIdInRoom: (roomId, senderId) => {
        let sqlStmt = `SELECT user_id FROM rooms_user WHERE room_id = ${conn.escape(roomId)} and user_id != ${conn.escape(senderId)}`;
        return sendQuery(sqlStmt);
    },

    getRoomIdForUsers: (senderId, receiverId) => {
        let sqlStmt = `SELECT ru.room_id, (SELECT room FROM room WHERE id = ru.room_id) as roomName 
            FROM rooms_user ru
            INNER JOIN (SELECT room_id, user_id FROM rooms_user WHERE user_id = ${conn.escape(receiverId)}) other
            ON ru.room_id = other.room_id
            WHERE ru.user_id = ${conn.escape(senderId)}`;
        return sendQuery(sqlStmt);
    },

    deleteRoom: (roomId) => {
        let sqlStmt = `DELETE FROM room WHERE id = ${conn.escape(roomId)}`;
        return sendQuery(sqlStmt);
    }

}

/**
 * Executes the query.
 * @param {String} sql_statement 
 */
function sendQuery(sql_statement) {
    return new Promise((resolve, reject) => {
        conn.query(sql_statement, (err, result, fields) => {//send builded query
            if (err) {
                //console.log(err);
                reject(err);
            }
            resolve(result);
        });
    })
}