const yt = require('ytdl-core');
const async = require('async');
var streamingQueue = require('./queue.js');
const youtubeAPI = require('./youtube.js');

streamingQueue = streamingQueue.streamingQueue;


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

            //Then stream the song
            var yt_options = { filter: 'audioonly', quality: 'highestaudio'};
            var play_options = { bitrate: '64000', volume: '.15', passes: '4'};
            cur_queue.dispatcher = voice_connection.playStream(yt( youtube_result.url, yt_options), play_options);
            cur_queue.status = "playing";

            //Add event listener for end of song
            cur_queue.dispatcher.on('end', () => {
                cur_queue.status = "stopped";
                that.playSongFromQueue(server_id, voice_connection);
            });
        }

        else {
            cur_queue.dispatcher.resume();
            cur_queue.status = "playing";
        }

    }

    //To do: add pause, timeout, skip, kick from voice, playlists, messages, print queue, error recovery, make sure validation is done somewhere above this


    return that;
}

module.exports = {musicController};
