const yt = require('ytdl-core');
var streamingQueue = require('./queue.js');
const youtubeAPI = require('./youtube.js');

streamingQueue = streamingQueue.streamingQueue;

const pause_timeout_ms = 1000 * 60 * 5; //5 minutes (arbitrary)


var musicController = function(spec, my) {

    var that = {};
    my = my || {};


    //map of queues keyed by server_id
    my.queues = {};

    my.queueExists = function(server_id) {
        if(my.queues[server_id] === undefined) {
            return false;
        }

        return true;
    }

    that.joinVoiceChannel = async function(channel) {
        await channel.join();
    }

    that.addSongToQueue = function(query_string, requester, server_id) {

        if(!my.queueExists(server_id)) {
            my.queues[server_id] = streamingQueue({server_id: server_id});
        }

        my.queues[server_id].addSong(query_string, requester)
    }

    that.clearQueue = function(server_id) {

        if(!my.queueExists(server_id)) {
            return;
        }

        my.queues[server_id].clear();
    }

    that.shuffleQueue = function(server_id) {

        if(!my.queueExists(server_id)) {
            return;
        }

        my.queues[server_id].shuffle();
    }

    that.playSongFromQueue = async function(server_id, voice_connection) {

        var cur_queue = my.queues[server_id];

        //Return immediately if no queue exists for server_id or if music is already playing
        if(!my.queueExists(server_id) || cur_queue.status === "playing") {
            return;
        }

        //send some message back, idk
        console.log("PlayNextSong called");

        //Treat resuming paused music differently than starting new song!

        if(cur_queue.status === "stopped") {


            if(cur_queue.getNextSong() === undefined) {
                voice_connection.disconnect();
                return;
            }

            //First get the next song from the queue
            var next_song = cur_queue.popNextSong();

            //Then look up song on youtube (Optimize this later)
            var youtube_result = await youtubeAPI.getYoutubeSongInfo(next_song.query_string);
            console.log("youtube result: " + youtube_result.url);

            //Then stream the song
            var yt_options = { filter: 'audioonly', quality: 'highestaudio'};
            var play_options = { bitrate: '48000', volume: '.25', passes: '2'};
            cur_queue.dispatcher = voice_connection.playStream(yt(youtube_result.url, yt_options), play_options); //Look into the ytdl documentation because there may be a better way to do this / library to use (or ffmpeg directly https://github.com/fent/node-ytdl-core/blob/HEAD/example/ffmpeg.js)
            cur_queue.status = "playing";
            cur_queue.voice_connection = voice_connection;
            cur_queue.play_next_song = true;

            //Add event listener for end of song
            cur_queue.dispatcher.on('end', (reason) => {
                console.log("dispatcher ended: " + reason);
                cur_queue.status = "stopped";

                //If a playing song ended, play the next one
                if(cur_queue.play_next_song === true) {
                    that.playSongFromQueue(server_id, voice_connection);
                }

                //If ended for another reason (pause timeout, user command), don't play next song
                return;
            });

            cur_queue.dispatcher.on('error', (err) => {
                console.log('A dispatcher error occured:');
                console.log(err);
            });

            cur_queue.dispatcher.on('debug', (info) => {
                console.log('Dispatcher debugging info:')
                console.log(info);
            });

        }

        else {
            cur_queue.dispatcher.resume();
            cur_queue.status = "playing";
        }

    }

    that.pauseMusicfromQueue = function (server_id) {

        var cur_queue = my.queues[server_id];

        //Return immediately if no queue exists for server_id or if music is already playing
        if(!my.queueExists(server_id) || cur_queue.status != "playing") {
            return;
        }

        cur_queue.dispatcher.pause();
        cur_queue.status = "paused";

        //Cause the bot to leave the voice channel if paused too long
        setTimeout(() => {
            if(cur_queue.status === "paused") { //Yeah this doesn't account for pause -> unpause -> pause but I don't think that's a big deal
                cur_queue.play_next_song = false;
                cur_queue.status = "stopped";
                cur_queue.voice_connection.disconnect();
            }},
            pause_timeout_ms);

    }

    //To do: add pause, timeout, skip, kick from voice, playlists, messages, print queue, error recovery, make sure validation is done somewhere above this


    return that;
}

module.exports = {musicController};
