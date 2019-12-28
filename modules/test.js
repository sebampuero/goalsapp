const gen = require('./thumbnailGen');


function test() {
    gen.generateThumbnail(__dirname + "/uploads/motivation.mp4");
}

test();