const db = require('../db/db');


function test() {
    db.checkGoalsRequiresPermission([14,3,4,5]).then((result) => {
        console.log(result)
    })
}

test();