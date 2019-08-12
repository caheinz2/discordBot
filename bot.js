const Discord = require('discord.js');
const auth = require('./secrets/auth.json');
const musicController = require('./musicController.js').musicController();
const botReplies = require('./botReplies.json');


//Top level discord bot file with helper bot commands below
const MYAPP = {};
MYAPP.command_prefix = '$';
MYAPP.command_prefix_length = 1;
MYAPP.supported_commands = ['ping', 'play', 'pause', 'unpause',
                            'resume', 'next', 'skip', 'shuffle', 'add',
                            'clear', 'queue', 'help'];


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

    //I encountered a bug where sometimes the authentication fails without indication
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
                if(bot_reply != undefined) {
                    message.channel.send(bot_reply);
                }
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

    //Log command to console
    console.log(`\n New User Command From:  ${message.author.username} \n Command: ${message.content} \n`)

    //Do whatever the command is
    switch(command_input_array[0]) {

        case 'help':

            let command_list_string = "";
            for (let command of MYAPP.supported_commands) {
                command_list_string += command + '\n';
            }
            return `Currently supported commands: \n\n${command_list_string} \nFor additional information about each command, type ${MYAPP.command_prefix} {command} -h`;

        case 'ping':

            return 'pong';

        case 'play':

            if(!message.guild) {
                return 'Must be in a guild to perform this action';
            }

            if(!message.member.voiceChannel) {
                return 'User must be in a voice channel for music to play';
            }

            //join voice chat with the user and play music queue
            try {
                await musicController.joinVoiceChannel(message.member.voiceChannel);
                musicController.playSongFromQueue(message.guild.id, message.guild.voiceConnection);
                return;
            }
            catch(err) {
                console.log(err);
                return 'An error occured';
            };


        case 'shuffle':

            if(!message.guild) {
                return 'Must be in a guild to perform this action';
            }

            musicController.shuffleQueue(message.guild.id);

            return 'Queue has been shuffled';

        case 'add':

            if(!message.guild) {
                return 'This command only works in guilds';
            }

            //Add song from youtube by searching input string
            var query_string = message.content.substring(MYAPP.command_prefix_length + 5); //this is the inputted command with '$ add ' stripped
            musicController.addSongToQueue(query_string, message.author.username, message.guild.id);

            //Attempt to play music that was just added
            try {

                if(!message.member.voiceChannel) {
                    return 'User must be in a voice channel for added music to play';
                }

                await musicController.joinVoiceChannel(message.member.voiceChannel);
                musicController.playSongFromQueue(message.guild.id, message.guild.voiceConnection);
            }
            catch(err) {
                //do nothing
            };

            return; //if return function_result, the playing message pops up before the added one.
    }
}

//To do: clean up repeated messages, standardize message and try/catch policies, possibly restructure into a class, lowercase input
main();
