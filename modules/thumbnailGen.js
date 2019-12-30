/**
 * @file thumbnailGen.js
 * @description Module for video and imaging processing
 * 
 * @author Sebastian Ampuero
 * @version 1.0
 * @since 10.12.2019
 */

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const FfmpegCommand = require('fluent-ffmpeg');
const filepath = __dirname;

module.exports = {

    /**
     * Generates a thumbnail from a video
     */
    generateThumbnail: (videoPath) => {
        FfmpegCommand.setFfmpegPath(ffmpegPath);
        FfmpegCommand.setFfprobePath(ffprobePath);
        const command = new FfmpegCommand(videoPath);
        command.screenshots({
            timestamps: ['50%'], // at 50% of video length
            filename: 'thumbnail.png',
            folder: filepath + '/uploads' // attention: this path only works on linux based systems
            // on windows use \\
            //size: '530x300'
        });
        return filepath + '/uploads/thumbnail.png';
    }

}
