const Twitter = require('twitter');
const creds = require('./secrets/twitterCreds.json');

const MYAPP = {};
MYAPP.tweet_max_offset = 600; //This is somewhat arbitrary but a large offset
                              //takes a while to process and also we don't want
                              // an offset larger than the number of tweets a user has.

MYAPP.twitter_usernames = ['thehobbitfreak', 't4k4b', 'tnari5'];

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}

async function getTweetFromUserWithOffset(twitter_client, tweet_offset_from_newest, screen_name) {

    let prev_max_id = 0;
    let tweets;
    let tweets_seen = 0;
    let relevant_tweet;

    //This function assumes the user has enough tweets that one will be returned
    //for any offset < MYAPP.tweet_max_offset
    while(1) {

        //If on first batch
        if (tweets_seen == 0) {
            tweets = await twitter_client.get('statuses/user_timeline',
                { screen_name: screen_name,
                  count: 200,
                  trim_user: 'true',
                  tweet_mode: "extended",
                  include_rts: "false",
                  exclude_replies: "true" });
        }

        else {
            tweets = await twitter_client.get('statuses/user_timeline',
                { screen_name: screen_name,
                  count: 200,
                  trim_user: 'true',
                  max_id: prev_max_id,
                  tweet_mode: "extended",
                  include_rts: "false",
                  exclude_replies: "true"});
        }

        let num_tweets_in_batch = tweets.length;

        //If the tweet with the offset is in the current batch, return it.
        if(tweets_seen + num_tweets_in_batch >= tweet_offset_from_newest) {
            relevant_tweet = tweets[tweet_offset_from_newest - tweets_seen];
            return relevant_tweet;
        }

        prev_max_id = tweets[num_tweets_in_batch-1].id;
        tweets_seen += num_tweets_in_batch;
    }

}

async function getRandomTweetFromMember() {

    const twitter_client = new Twitter({
        consumer_key: creds.consumer_key,
        consumer_secret: creds.consumer_secret,
        access_token_key: creds.access_token_key,
        access_token_secret: creds.access_token_secret
    });

    const random_user_id = randomInt(0, MYAPP.twitter_usernames.length);
    let tweet;
    const random_tweet_offset = randomInt(0, MYAPP.tweet_max_offset);

    tweet = await getTweetFromUserWithOffset( twitter_client,
                                              random_tweet_offset,
                                              MYAPP.twitter_usernames[random_user_id]);

    if(tweet.id_str == undefined) {
        console.log(tweet);
    }
    return 'https://twitter.com/' + MYAPP.twitter_usernames[random_user_id] + '/status/' + tweet.id_str;

}



module.exports = {getRandomTweetFromMember};
