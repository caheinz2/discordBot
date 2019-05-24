const async = require('async');
const creds = require('./secrets/youtubeCreds.json');
const YouTube = require('simple-youtube-api');

const youtube = new YouTube(creds.data_api_auth_key);

async function addYoutubeVideoToMusicQueue(youtube_query_string, music_queue, message) {

    try {
        //search youtube with input query string
        const search_results = await youtube.searchVideos(youtube_query_string, 1);
        const first_result_url = 'https://www.youtube.com/watch?v=' + search_results[0].id;
        const first_result_title = search_results[0].title; /* TODO: Fix this line so that uri stuff is decoded (ex: &quot) */

        //put the first result in the music queue
        music_queue.songs.push({url: first_result_url, title: first_result_title, requested_by: message.author.username});
        return `Added song: **${first_result_title}** as requested by: **${message.author.username}**`;
    }
    catch(err) {
        console.log(err);
        return 'An error occured'
    }
}



module.exports = {addYoutubeVideoToMusicQueue};
