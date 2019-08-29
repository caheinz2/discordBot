const _ = require('underscore');

// spec = {server_id} (unused so far)

var queue = function (spec, my) {

    var that = {};
    my = my || {};

    my.songs = []; //actual queue

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

    that.print_queue = function(channel) {
        channel.send("Music Queue: ")
        _.each(my.songs, (song) => {
            channel.send(`   '${song.query_string}'`);
        });

        if(my.songs.length === 0) {
            channel.send("   Empty");
        }
    }

    return that;
}

var streamingQueue = function(spec, my) {

    var that = queue(spec);
    var my = my || {};

    that.dispatcher = {}; //streams youtube music
    that.status = "stopped"; //status is playing, paused, or stopped
    that.play_next_song = true; //play another on song end?
    that.text_channel = spec.text_channel; //channel queue was created from, used to send status messages
                                           //TODO: Maybe make text_channel and dispatcher private variables and add some access control?

    //override print function (I need to figure out how to properly do this...have streamingQueue override queue and call both methods 'print');
    that.print = function() {
        that.print_queue(that.text_channel);
    }

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
