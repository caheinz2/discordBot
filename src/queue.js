const _ = require('underscore');

// spect = {server_id}

var queue = function (spec, my) {

    var that = {};
    my = my || {};

    my.songs = []; //actual queue
    my.dispatcher = {}; //streams youtube music
    my.status = "stopped"; //status is playing, paused, or stopped

    that.getQueueLength = function() {
        return my.songs.length;
    }

    that.getNextSong = function() {
        return my.songs[0];
    }

    that.popNextSong = function() {
        return my.songs.shift();

    }

    that.addSong = function(query_string, requester) {
        my.songs.push({query_string: query_string, requester: requester});
    }

    that.shuffle = function() {
        my.songs = _.shuffle(my.songs);
    }

    that.clear = function() {
        my.songs = [];
    }

    that.print = function(channel) {
        _.each(my.songs, (song) => {
            channel.send(`  Query String: ${song.query_string} \n  Requested By: ${song.requester}`);
        })
    }

    return that;
}

var streamingQueue = function(spec, my) {

    var that = queue(spec);
    var my = my || {};

    that.dispatcher = {}; //streams youtube music
    that.status = "stopped"; //status is playing, paused, or stopped
    that.play_next_song = true;

    return that;
}

//Tests
/*
var send = function(arg) {console.log(arg);}


var a = queue({server_id: 1234});
a.addSong("Don't Stop Believing", "Caleb");
a.addSong("Old Town Road", "David");
a.addSong("Some Japanese Bullshit", "Blake");
console.log(a.getQueueLength());
console.log(a.getNextSong());
a.print({send});
a.shuffle();
a.print({send});
a.popNextSong();
console.log(a.getQueueLength());
*/

module.exports = {streamingQueue};
