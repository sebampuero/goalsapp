/**
 * @file cloudinary.js
 * @description Cloudinary module
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 03.12.2019
 */

const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: 'sebampuerom',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

module.exports = {
    /**
     * Uploads a file to the cloudinary cloud. Must be either image or video.
     * @param {String} path the path to the file
     * @returns {Promise} When resolves: returns the url of the uploaded file
     */
    uploadToSite: (path, filetype) => {
        return new Promise((resolve, reject) => {
            let options = {
                use_filename: true, // set to true in order to use the filename as public ID for the file
                resource_type: filetype
            }
            cloudinary.uploader.upload(path, options, (err, result) => {
                if (err)
                    reject(err);
                else
                    resolve(result.secure_url); // url of the uploaded file
            });
        });
    }
    ,

    /**
     * Uploads a video and also an image being the thumbnail of the video
     */
    uploadVideoWithThumbnail: (videoPath, videoThumbnailPath) => {
        return new Promise((resolve, reject) => {
            let optionsVideo = {
                use_filename: true,
                resource_type: "video"
            }
            let optionsImage = {
                use_filename: true,
                resource_type: "image"
            }
            cloudinary.uploader.upload(videoPath, optionsVideo, (err, resultVideo) => {
                if (err)
                    reject(err);
                cloudinary.uploader.upload(videoThumbnailPath, optionsImage, (err, resultThumbnail) => {
                    if (err)
                        reject(err);
                    resolve({
                        videoUrl: resultVideo.secure_url,
                        thumbnailUrl: resultThumbnail.secure_url
                    })
                });
            });
        });
    },
    
}