/**
 * @file fileUtils.js
 * @description File utils module
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const fs = require('fs');
const cloudinaryModule = require("../modules/cloudinary");
const thumbGen = require('./thumbnailGen');

const filepath = __dirname;

module.exports = {
    /**
     * Saves an image file to the local filesystem. 
     * @param {String} data the 64encoded data of the image
     * @param {String} fileName 
     */
    saveImageFile: (data, fileName) => {
        return new Promise((resolve, reject) => {
            if (!data)
                resolve();
            let base64Data = data.replace(/^data:image\/png;base64,/, "");
            let binaryData = new Buffer(base64Data, 'base64').toString('binary');
            fs.writeFile(filepath + "/uploads/" + fileName, binaryData, "binary", (err) => {
                if (err) reject(err);
                console.log("exists " + fs.existsSync(filepath + "/uploads/" + fileName));
                cloudinaryModule.uploadToSite(filepath + "/uploads/" + fileName, "image").then((url) => {
                    resolve(url);
                }).catch((err) => {
                    reject(err);
                });
            });
        })
    },

    /**
     * Saves a video file to the local filesystem.
     * @param {String} data the 64 encoded data of the video
     * @paran {String} fileName
     */
    saveVideoFile: (data, fileName) => {
        return new Promise((resolve, reject) => {
            let binaryData = new Buffer(data, "base64").toString("binary");
            fs.writeFile(filepath + "/uploads/" + fileName, binaryData, "binary", (err) => {
                if (err) reject(err);
                let videoThumbnailPath = thumbGen.generateThumbnail(filepath + "/uploads/" + fileName);
                console.log(videoThumbnailPath);
                cloudinaryModule.uploadVideoWithThumbnail(filepath + "/uploads/" + fileName, videoThumbnailPath).then((result) => {
                    resolve(result);
                }).catch((err) => {
                    reject(err);
                });
            });
        });
    }
}