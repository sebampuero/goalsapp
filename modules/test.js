const db = require('../db/db');


function test() {
    db.checkIfGoalsAllowedForUser(71,[14,3,4,5]).then(() => {
        console.log("then")
    }).catch(err => {
        console.log("catch")
    })
}

test();