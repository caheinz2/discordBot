const yt = require('ytdl-core');
const async = require('async');

var playing;
var queue = {songs: [] };

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
        message.channel.send('Bot already playing music');
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
        //message.channel.send(`Playing: **${song.title}** as requested by: **${song.requester}**`);
        if(message.guild.voiceConnection == null) {
            return;
        }
        dispatcher = message.guild.voiceConnection.playStream(yt(song.url, { filter: 'audioonly', quality: 'highestaudio'}), {bitrate: '64000', volume: '.5', passes: '3'});
        let collector = message.channel.createCollector(m => m);
        collector.on('collect', m => {
            if (m.content.startsWith('!kb pause')) {
                dispatcher.pause();
            } else if (m.content.startsWith('!kb unpause')){
                dispatcher.resume();
            } else if (m.content.startsWith('!kb skip')){
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
        dispatcher.end();
        //Leaves channel already on disconnect.
        return;
    });
    message.guild.voiceConnection.on('error', () => {
        queue.songs = [];
        playing = false;
        dispatcher.end();
        message.member.voiceChannel.leave();
        return;
    });

}



module.exports = {join, queue, play};
