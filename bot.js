const Discord = require('discord.js');
const auth = require('./secrets/auth.json');
const tweets = require('./twitter.js');
const streaming = require('./streaming.js');
const youtube = require('./youtube.js');
const yt = require('ytdl-core');
const spotify = require('./spotify.js');
const botReplies = require('./botReplies.json');


//Top level discord bot file with helper bot commands below
const MYAPP = {};
MYAPP.command_prefix = '!kb';
MYAPP.command_prefix_length = 3;
MYAPP.supported_commands = ['ping', 'tweet', 'play', 'pause', 'unpause',
                            'resume', 'next', 'skip', 'shuffle', 'add',
                            'clear', 'queue', 'kick', 'help'];


function main() {

    //connect the bot to discord servers
    connectToDiscord();

    //set up bot event listeners
    registerBotListeners();


}


//Helper functions

function connectToDiscord() {

    //set administrative bot variables
    MYAPP.is_connected = false;
    MYAPP.bot = new Discord.Client();

    //authenticate bot with Discord server
    MYAPP.bot.login(auth.token);

    //I encountered a bug where sometimes the authentication without indication
    //so this timer will check back in 5min and try again if needed.
    setTimeout(restartBot, 5 * 60 * 1000);
}


function restartBot() {

    //If the bot failed authentication with Discord servers, restart the process.
    //When this is running on top of PM2, exiting with an error code will cause
    //the process to restart automatically
    if(!MYAPP.is_connected) {
        console.log("restarting process...");
        process.exit(0);
    }
}


function registerBotListeners() {

    MYAPP.bot.on('ready', function (evt) {
        console.log('Connected');
        MYAPP.is_connected = true;
    });

    MYAPP.bot.on('error', err => {
        console.log('Bot encountered an error');
        console.error(err);
        bot.destroy();
        initiateBot();
    });

    MYAPP.bot.on('warn', err => {
        console.warn(err);
    });

    MYAPP.bot.on('message', message => {
        if (message.content.substring(0, MYAPP.command_prefix_length) === MYAPP.command_prefix) {

            //get rid of prefix and put each subsequent word into an array index
            const command_input_array = message.content.substring(MYAPP.command_prefix_length + 1).split(' ');

            //do whatever action is required by the command and reply to user
            respondToInput(command_input_array, message).then(bot_reply => {
                message.channel.send(bot_reply);
            });
        }
    });
}


async function respondToInput(command_input_array, message) {

    //command_input_array -> (command, flag)

    //Make sure command is valid
    if(!MYAPP.supported_commands.includes(command_input_array[0])) {
        return `This command (${command_input_array[0]}) is not supported`;
    }

    //send help message if -h flag is given
    if(command_input_array[1] == '-h') {
        return botReplies[command_input_array[0]];
    }

    //Do whatever the command is
    switch(command_input_array[0]) {

        case 'help':

            let command_list_string = "";
            for (let command of MYAPP.supported_commands) {
                command_list_string += command + '\n';
            }
            return `Currently supported commands: \n\n${command_list_string} \nFor additional information about each command, type !kb {command} -h`;

        case 'ping':

            return 'pong';

        case 'tweet':

            //get a random tweet from the bois
            try {
                let tweet_url = await tweets.main();
                console.log(tweet_url);
                return tweet_url;
            }
            catch(err) {
                console.log(err);
                return 'An error occured';
            }

        case 'play':

            //join voice chat with the user and play music queue
            try {
                await streaming.join(message);
                await streaming.play(message);
                return;
            }
            catch(err) {
                console.log(err);
                return 'An error occured';
            };


        case 'shuffle':

            shuffle(streaming.queue.songs);
            return 'Queue has been shuffled';

        case 'add':

            if(!message.guild) {
                return 'This command only works in guilds';
            }

            //Add spotify playlist by id
            if(command_input_array[1] == 'playlist') {
                spotify.getSpotifyPlaylist(args[2], streaming.queue, message);
                return;
            }

            //Add song from youtube by searching input string
            else {
                var query_string = message.content.substring(8);
                youtube.add(query_string, streaming.queue, message)
                return;
            }

        case 'queue':

            //handle sending a message to the user differently in this case.
            //I want to send several messages as the function is running so I
            //can't just have a return statement.

            message.channel.send('Music queue is: ')
            var queue_string = '';

            //build reply by iterating through the queue
            for(let song of streaming.queue.songs) {

                queue_string += `Song: **${song.title}** as requested by: **${song.requestedBy}** \n`

                //Send the string in chuncks if it's long to prevent a long stall
                if(queue_string.length > 1800) {
                    message.channel.send(queue_string);
                    queue_string = '';
                }
            }

            //send last chunck of queue string
            if(queue_string != '') {
                return queue_string;
            }

        case 'clear':

            streaming.queue.songs = [];
            return 'Queue has been cleared';

        case 'kick':

            if(!message.guild) {
                return 'This command only works in guilds';
            }

            message.guild.voiceConnection.disconnect();
            return;

        // Just add any case commands if you want to..
    }
}

function shuffle(array) {

    let cur_idx = array.length;

    // While there are elements in the array
    while (counter > 0) {

        // Pick a random index
        let new_index = Math.floor(Math.random() * cur_idx);

        // Decrease counter by 1
        cur_idx--;

        // And swap the current element with it
        let temp = array[cur_idx];
        array[cur_idx] = array[new_idx];
        array[new_idx] = temp;
    }
}

main();
