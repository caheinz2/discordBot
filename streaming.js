const yt = require('ytdl-core');
const async = require('async');

const MYAPP = {};
MYAPP.music_is_playing = false;
MYAPP.queue = {songs: []};
MYAPP.music_is_paused = false;
MYAPP.max_inactivity_ms = 600000; //10 minutes

/* TODO: These functions send messages directly to the channel, different
than the approach other functions take. Also, joinVoiceChannel throws errors,
which no other function does. I should standardize this stuff.
*/

//TODO: Make message globally available?

async function joinVoiceChannel(message) {

    //Make sure the bot can join the voice channel the user is in
    if(!message.guild) {
        message.channel.send('This command only works in guilds');
        throw new Error('This command only works in guilds');
    }
    else if(!message.member.voiceChannel) {
        message.channel.send('User must join the voice channel first');
        throw new Error('User must join the voice channel first');
    }

    //Join channel
    else {
        await message.member.voiceChannel.join();
    }
}


async function playMusicFromQueue(message) {

    //Make sure bot can play music
    if(MYAPP.music_is_playing) {
        return;
    }
    if(MYAPP.queue === undefined) {
        message.channel.send(`Add some songs to the queue first with !kb add`);
        return;
    }

    //Set status to playing
    MYAPP.music_is_playing = true;

    //For each song in the queue, call the play function
    //(this function calls itself recursively after the initial call)
    streamSong(MYAPP.queue.songs.shift(), message);

    //Resets the queue when the bot leaves the voice channel or encounters an error
    message.guild.voiceConnection.on('disconnect', () => {
        MYAPP.queue.songs = [];
        MYAPP.music_is_playing = false;
        //Leaves channel already on disconnect.
        return;
    });
    message.guild.voiceConnection.on('error', () => {
        MYAPP.queue.songs = [];
        MYAPP.music_is_playing = false;
        message.member.voiceChannel.leave();
        return;
    });

}


async function streamSong(song, message) {

    console.log(song);

    //If queue is empty, leave the voice channel
    if (song === undefined) return message.channel.send('Queue is empty').then(() => {
        message.member.voiceChannel.leave();
        MYAPP.music_is_playing = false;
    });

    //Send message to client with song info when new song plays
    message.channel.send(`Playing: **${song.title}** as requested by: **${song.requested_by }**`);
    if(message.guild.voiceConnection == null) {
        return;
    }

    //Set up dispatcher that streams audio from the song's url to the voice channel
    let dispatcher = message.guild.voiceConnection.playStream(yt(song.url,
                                                          { filter: 'audioonly', quality: 'highestaudio'}),
                                                          { bitrate: '64000', volume: '.15', passes: '4'});


    //set up listener for any user commands related to music
    let collector = message.channel.createCollector(m => m);
    collector.on('collect', m => {

        //Pause the music
        if (m.content.startsWith('!kb pause')) {
            dispatcher.pause();
            MYAPP.music_is_paused = true;
            setTimeout(() => {
                if(MYAPP.music_is_paused) {
                    //If it's been idle for 10 minutes, just leave chat
                    message.channel.send('Bot was paused for too long and left the voice channel');
                    message.guild.voiceConnection.disconnect();
                }
            }, MYAPP.max_inactivity_ms);
        }

        //Resume the music
        else if (m.content.startsWith('!kb unpause') ||
                 m.content.startsWith('!kb resume') ||
                 m.content.startsWith('!kb play')){
            dispatcher.resume();
            MYAPP.music_is_paused = false;
        }

        //Skip the current song
        else if (m.content.startsWith('!kb skip') ||
                 m.content.startsWith('!kb next')){
            dispatcher.end();
        }
    });

    //Dispatcher event listeners
    dispatcher.on('end', () => {
        collector.stop();
        console.log('dispatcher ended');
        streamSong(MYAPP.queue.songs.shift(), message);
    });
    dispatcher.on('error', err => {
        console.log(err);
        collector.stop();
        streamSong(MYAPP.queue.songs.shift(), message);
    });
}

//If possible, have the bot leave the channel when queue is empty
function exitGracefully(message) {
    if(message != null) {
        message.guild.voiceConnection.disconnect();
    }
}

//TODO: Can I export MYAPP.queue without exporting everything?
module.exports = {joinVoiceChannel, MYAPP, playMusicFromQueue};
