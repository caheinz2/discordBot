const async = require('async');
const creds = require('./youtubeCreds.json');
const YouTube = require('simple-youtube-api');

const youtube = new YouTube(creds.DataApiAuthKey);

async function add(queryString, queue, message) {

    try {
        var result = await youtube.searchVideos(queryString, 1);
        var url = 'https://www.youtube.com/watch?v=' + result[0].id;
        var title = result[0].title;
        queue.songs.push({url: url, title: title, requestedBy: message.author.username});
        message.channel.send(`Added song: **${title}** as requested by: **${message.author.username}**`);
    }
    catch(err) {
        console.log(err);
    }
}



module.exports = {add};
