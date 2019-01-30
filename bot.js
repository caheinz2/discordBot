var Discord = require('discord.js');
var auth = require('./auth.json');
var tweets = require('./twitter.js');
var streaming = require('./streaming.js');
var youtube = require('./youtube.js');
const yt = require('ytdl-core');
var spotify = require('./spotify.js');

//Maybe this works lol...I need to figure out what exactly this catches
//The goal is that if the bot crashes, pm2 can restart it whereas currently
//There is one specific error I get every few days that doesn't cause the process
//to exit but does cause it to stop being responsive.
process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception!' + err);
    process.exit(0);
});

// Initialize Discord Bot
var bot;
var hasConnected = false;

function restartBot() {
    if(!hasConnected) {
        console.log("restarting process...");
        process.exit(0); //PM2 will restart the process if the bot has tried to login but an error occurs
    }
}

function initiateBot() {
    console.log('Initializing Bot');
    hasConnected = false;
    bot = new Discord.Client();
    bot.login(auth.token);
    setTimeout(restartBot, 5 * 60 * 1000); //restart process after 5 minutes if bot hasn't logged in successfully
}

initiateBot();

bot.on('ready', function (evt) {
    console.log('Connected');
    hasConnected = true;
});

bot.on('error', err => {
    console.log('Bot encountered an error');
    console.error(err);
    bot.destroy();
    initiateBot();
});

bot.on('warn', err => {
    console.warn(err);
});

bot.on('message', message => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`

    if (message.content.substring(0, 3) === '!kb') {
        var args = message.content.substring(4).split(' ');
        var cmd = args[0];

        console.log(message.content);
        console.log('  ' + message.author.username);
        console.log('  ' + new Date(Date.now()).toLocaleString());

        switch(cmd) {
            // !ping
            case 'help':
                if(args[1] == '-h') {
                    message.channel.send("LOL");
                    break;
                }
                message.channel.send('Currently supported commands: \nping, tweet, play, pause, unpause, skip, shuffle, add, clear, queue, kick. \nFor additional information about each command, type !kb {command} -h');
                break;

            case 'ping':
                if(args[1] == '-h') {
                    message.channel.send("Bot responds with 'pong'. This is used to test if the bot is running.");
                    break;
                }
                message.channel.send('pong');
                break;

            case 'tweet':
                if(args[1] == '-h') {
                    message.channel.send("Bot responds with a random tweet from a member of the server.");
                    break;
                }
                tweets.main().then(url => {
                    console.log(url);
                    message.channel.send(url);
                })
                .catch(err => {
                    console.log(err);
                    message.channel.send('Something went wrong, please retry');
                });
                break;

            case 'play':
                if(args[1] == '-h') {
                    message.channel.send("Bot joins the voice channel the calling user is in and plays music if any has been queued up.");
                    break;
                }
                streaming.join(message)
                .then(() => {
                    streaming.play(message);
                })
                .catch(err => {
                    console.log(err);
                })
                break;

            case 'pause':
                if(args[1] == '-h') {
                    message.channel.send("Pauses the music if any is playing");
                    break;
                }
                break;

            case 'unpause':
                if(args[1] == '-h') {
                    message.channel.send("Unpauses the music if any was previously playing.");
                    break;
                }
                break;

            case 'skip':
                if(args[1] == '-h') {
                    message.channel.send("Skips currently playing song.");
                    break;
                }
                break;

            case 'shuffle':
                if(args[1] == '-h') {
                    message.channel.send("Shuffles the queue.");
                    break;
                }
                shuffle(streaming.queue.songs);
                message.channel.send("Queue has been shuffled");
                break;

            case 'add':

                if(args[1] == '-h') {
                    message.channel.send("Add a song or spotify playlist to the bot's music queue. \n  '!kb add {text}' searches youtube for the text and adds the result to the queue. \n  '!kb add playlist {Spotify playlist ID}' adds all songs from the playlist to the queue.");
                    break;
                }

                if(!message.guild) {
                    message.channel.send('This command only works in guilds');
                    break;
                }

                if(args[1] == 'playlist') {
                    spotify.getSpotifyPlaylist(args[2], streaming.queue, message);
                    break;
                }

                var queryString = message.content.substring(8);
                youtube.add(queryString, streaming.queue, message)
                break;

            case 'queue':
                if(args[1] == '-h') {
                    message.channel.send("Prints the bot's music queue.");
                    break;
                }
                message.channel.send('Music queue is: ')
                var queueString = '';
                streaming.queue.songs.forEach(song => {
                    queueString += `Song: **${song.title}** as requested by: **${song.requestedBy}** \n`
                    if(queueString.length > 1800) {
                        message.channel.send(queueString);
                        queueString = '';
                    }
                });
                if(queueString != '') {
                    message.channel.send(queueString);
                }
                break;

            case 'clear':
                if(args[1] == '-h') {
                    message.channel.send("Clears the queue");
                    break;
                }
                streaming.queue.songs = [];
                message.channel.send("Queue has been cleared");
                break;

            case 'kick':
                if(args[1] == '-h') {
                    message.channel.send("Kicks the bot from the voice channel");
                    break;
                }

                if(!message.guild) {
                    message.channel.send('This command only works in guilds');
                    break;
                }

                message.guild.voiceConnection.disconnect();
                break;

            // Just add any case commands if you want to..
         }
     }
});

function shuffle(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}
