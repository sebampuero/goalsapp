const db = require('../db/db');


function test() {
    db.setNewMessageInRoom([{id: 68}], 67, 0);
}

test();