const async = require('async');
const creds = require('./secrets/youtubeCreds.json');
const YouTube = require('simple-youtube-api');

const youtube = new YouTube(creds.data_api_auth_key);

async function addYoutubeVideoToMusicQueue(youtube_query_string, music_queue, message) {

    try {

        /* TODO: An enormous amount of queries is being made!
           I'm not sure if there's a 1-1 ratio between api calls and queries,
           but ~100 api calls is > 20,000 queries atm. Maybe the wrapper I'm
           using is shit, idk. I need to look into this and maybe just do it
           manually */
       //https://developers.google.com/youtube/v3/getting-started#quota

        //search youtube with input query string
        const search_results = await youtube.searchVideos(youtube_query_string, 1); //(search string, max num results)
        const first_result_url = 'https://www.youtube.com/watch?v=' + search_results[0].id;
        const first_result_title = search_results[0].title; /* TODO: Fix this line so that uri stuff is decoded (ex: &quot) */

        //put the first result in the music queue
        music_queue.songs.push({url: first_result_url, title: first_result_title, requested_by: message.author.username});
        return `Added song: **${first_result_title}** as requested by: **${message.author.username}** from search string **${youtube_query_string}`;
    }
    catch(err) {
        //console.log(err);
        return 'An error occured'
    }
}



module.exports = {addYoutubeVideoToMusicQueue};
