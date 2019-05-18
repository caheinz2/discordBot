const yt = require('ytdl-core');
const async = require('async');

var playing;
var queue = {songs: [] };

let pausedInactivity = false;

async function join(message) {
    if(!message.guild) {
        message.channel.send('This command only works in guilds');
        throw new Error('This command only works in guilds');
    }
    else if(!message.member.voiceChannel) {
        message.channel.send('User must join the voice channel first');
        throw new Error('User must join the voice channel first');
    }
    else {
        await message.member.voiceChannel.join();
    }
}

async function play(message) {

    if(playing) {
        return;
    }
    if(queue === undefined) {
        message.channel.send(`Add some songs to the queue first with !kb add`);
        return;
    }

    playing = true;

    console.log(queue);
    (function play(song) {
        console.log(song);
        if (song === undefined) return message.channel.send('Queue is empty').then(() => {
            message.member.voiceChannel.leave();
            playing = false;
        });
        message.channel.send(`Playing: **${song.title}** as requested by: **${song.requestedBy}**`);
        if(message.guild.voiceConnection == null) {
            return;
        }
        dispatcher = message.guild.voiceConnection.playStream(yt(song.url, { filter: 'audioonly', quality: 'highestaudio'}), {bitrate: '64000', volume: '.15', passes: '4'});
        let collector = message.channel.createCollector(m => m);
        collector.on('collect', m => {
            if (m.content.startsWith('!kb pause')) {
                dispatcher.pause();
                pausedInactivity = true;
                setTimeout(() => {
                    if(pausedInactivity) {
                        //If it's been idle for 10 minutes, just leave chat
                        message.channel.send('Bot was paused for too long and left the voice channel');
                        message.guild.voiceConnection.disconnect();
                    }
                }, 600000);
            } else if (m.content.startsWith('!kb unpause') || m.content.startsWith('!kb resume') || m.content.startsWith('!kb play')){
                dispatcher.resume();
                pausedInactivity = false;
            } else if (m.content.startsWith('!kb skip') || m.content.startsWith('!kb next')){
                dispatcher.end();
            }
        });
        dispatcher.on('end', () => {
            collector.stop();
            play(queue.songs.shift());
        });
        dispatcher.on('error', err => {
            console.log(err);
            collector.stop();
            play(queue.songs.shift());
        });
    })(queue.songs.shift());

    message.guild.voiceConnection.on('disconnect', () => {
        queue.songs = [];
        playing = false;
        //Leaves channel already on disconnect.
        return;
    });
    message.guild.voiceConnection.on('error', () => {
        queue.songs = [];
        playing = false;
        message.member.voiceChannel.leave();
        return;
    });

}

function exitGracefully(message) {
    if(message != null) {
        message.guild.voiceConnection.disconnect;
    }
}


module.exports = {join, queue, play};
