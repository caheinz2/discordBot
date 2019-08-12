const async = require('async');
const creds = require('./secrets/youtubeCreds.json');
const YouTube = require('simple-youtube-api');

const youtube = new YouTube(creds.data_api_auth_key);

async function addYoutubeVideoToMusicQueue(youtube_query_string, music_queue, message) {

    try {

        /* TODO: right now our Youtube Data API query limit is 20,000
           where one search is 100 queries. This means we can only have 200
           songs per day.

           Maybe to reduce the number of queries we should add a database that
           remembers urls?

           https://developers.google.com/youtube/v3/getting-started#quota
         */

         // TODO: sometimes the returned song is strange (ex: U & US Quinn XCII is some documentary)

        //search youtube with input query string
        const search_results = await youtube.searchVideos(youtube_query_string, 1); //(search string, max num results)
        const first_result_url = 'https://www.youtube.com/watch?v=' + search_results[0].id;
        const first_result_title = search_results[0].title; /* TODO: Fix this line so that uri stuff is decoded (ex: &quot) */

        //put the first result in the music queue
        music_queue.songs.push({url: first_result_url, title: first_result_title, requested_by: message.author.username});
        return `Added song: **${first_result_title}** as requested by: **${message.author.username}**`;
    }
    catch(err) {
        //console.log(err);
        return 'An error occured'
    }
}

async function getYoutubeSongInfo(youtube_query_string) {

    //search youtube with input query string
    const search_results = await youtube.searchVideos(youtube_query_string, 1); //(search string, max num results)
    const first_result_url = 'https://www.youtube.com/watch?v=' + search_results[0].id;
    const first_result_title = search_results[0].title; /* TODO: Fix this line so that uri stuff is decoded (ex: &quot) */

    return({url: first_result_url, title: first_result_title});
}



module.exports = {addYoutubeVideoToMusicQueue, getYoutubeSongInfo};
