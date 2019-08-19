const async = require('async');
const creds = require('./secrets/spotifyCreds.json');
const request = require('request');
var youtube = require('./youtube.js');


async function addSpotifyPlaylistToMusicQueue(playlist_id, music_queue, message) {

    const get_access_token_options = {
        url: 'https://accounts.spotify.com/api/token',
        method: 'POST',
        form: {
            'grant_type': 'client_credentials'
        },
        auth: {
            'user': creds.client_id,
            'pass': creds.client_secret
        }
    };

    //First api call is to  receive an access token to read a private playlist by id
    request(get_access_token_options, function(err, res, body) {

        //make sure response is valid
        if(err != null) {
            console.log(err);
            message.channel.send("Something went wrong importing Spotify playlist.");
        }

        //read access token
        const playlist_access_token = JSON.parse(body).access_token;

        //make next spotify api call
        const get_songs_options = {
            url: 'https://api.spotify.com/v1/playlists/' + playlist_id,
            method: 'GET',
            qs: {
                'fields': 'tracks.items(track(name, artists))'
            },
            auth: {
                'bearer': playlist_access_token
            }
        }

    //Second api call is to receive a list of all song titles in a playlist
    request(get_songs_options, function(err, res, body) {

        if(err != null) {
            console.log(err);
            message.channel.send("Something went wrong importing Spotify playlist.");
        }

        body = JSON.parse(body);

        //for each song title, search youtube for a corresponding music video
        for (let song of body.tracks.items) {

            let search_string = song.track.name + ' ' + song.track.artists[0].name;
            youtube.addYoutubeVideoToMusicQueue(search_string, music_queue, message).then(song_info => {
                message.channel.send(song_info);
            });
            //TODO: Send a message back to the client when the last song has been added

        }
    })
    });
}

module.exports = {addSpotifyPlaylistToMusicQueue}
