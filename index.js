/**
 * @file index.js
 * @description Nodejs server
 * 
 * @author Sebastian Ampuero
 * @since 03.12.2019
 * @version 1.0
 */

const express = require("express");
const bodyparser = require("body-parser");
const http = require('http');
const app = express();
const api = require("./api/api");
const ioModule = require('./modules/ioModule');
const server = http.createServer(app);
const port = process.env.PORT || 5000;

app.use(bodyparser.json({ limit: "50mb" })); // to admit uploading the images to the server
app.use(bodyparser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use("/api", api); // use configured routes
ioModule.startIo(server);

server.listen(port, "0.0.0.0", () => {
    console.log(`Listening on port ${port}`);
});
