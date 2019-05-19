const Twitter = require('twitter');
const creds = require('./secrets/twitterCreds.json');
const async = require('async');


function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}

async function getTweetNumbered(client, number, screen_name) {

    let prevMaxID = 0;
    let tweets;
    let tweetCount = 0;
    let relevantTweet;

    while(1) {

        if (tweetCount == 0) {
            tweets = await client.get('statuses/user_timeline', {screen_name: screen_name, count: 200, trim_user: 'true', tweet_mode: "extended", include_rts: "false", exclude_replies: "true"});
        }

        else{
            tweets = await client.get('statuses/user_timeline', {screen_name: screen_name, count: 200, trim_user: 'true', max_id: prevMaxID, tweet_mode: "extended", include_rts: "false", exclude_replies: "true"});
        }

        let numTweetsReturned = tweets.length;

        if(tweetCount + numTweetsReturned >= number) {
            relevantTweet = tweets[number - tweetCount];
            return relevantTweet;
        }

        prevMaxID = tweets[numTweetsReturned-1].id;
        tweetCount += numTweetsReturned;
    }

}

async function main() {

    const client = new Twitter({
        consumer_key: creds.consumer_key,
        consumer_secret: creds.consumer_secret,
        access_token_key: creds.access_token_key,
        access_token_secret: creds.access_token_secret
    });

    let randUser = randomInt(0, 3);
    let tweet;
    let randTweetNum = randomInt(0, 601);
    let users = ['thehobbitfreak', 't4k4b', 'tnari5'];

    tweet = await getTweetNumbered(client, randTweetNum, users[randUser]);
    return 'https://twitter.com/' + users[randUser] + '/status/' + tweet.id_str;

}



module.exports = {main};
