const async = require('async');
const creds = require('./secrets/spotifyCreds.json');
const request = require('request');
var youtube = require('./youtube.js');


async function getSpotifyPlaylist(playlistID, queue, message) {
    const options = {
        url: 'https://accounts.spotify.com/api/token',
        method: 'POST',
        form: {
            'grant_type': 'client_credentials'
        },
        auth: {
            'user': creds.clientID,
            'pass': creds.clientSecret
        }
    };

    request(options, function(err, res, body) {
        if(err != null) {
            console.log(err);
            message.channel.send("Something went wrong importing Spotify playlist.");
        }
        var access_token = JSON.parse(body).access_token;

        const options2 = {
            url: 'https://api.spotify.com/v1/playlists/' + playlistID,
            method: 'GET',
            qs: {
                'fields': 'tracks.items(track(name, artists))'
            },
            auth: {
                'bearer': access_token
            }
        }

        request(options2, function(err, res, body) {
            if(err != null) {
                console.log(err);
                message.channel.send("Something went wrong importing Spotify playlist.");
            }
            body = JSON.parse(body);
            body.tracks.items.forEach(index => {
                var searchString = index.track.name + ' ' + index.track.artists[0].name;
                youtube.add(searchString, queue, message);
            });
        })
    });
}

module.exports = {getSpotifyPlaylist}
