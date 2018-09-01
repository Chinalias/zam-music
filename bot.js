const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require('ytdl-core');
const request = require('request');
const fs = require('fs');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
 
const yt_api_key = "AIzaSyDeoIH0u1e72AtfpwSKKOSy3IPp2UHzqi4";
const prefix = 'Z';
client.on('ready', function() {
    client.user.setGame(` Zam-baktash . `,"http://twitch.tv/Baktash_183")
    console.log(`i am ready ${client.user.username}`);
});
/*
////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
*/
var servers = [];
var queue = [];
var guilds = [];
var queueNames = [];
var isPlaying = false;
var dispatcher = null;
var voiceChannel = null;
var skipReq = 0;
var skippers = [];
var now_playing = [];
/*
\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////
\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////
\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////
\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////
*/
client.on('ready', () => {});
var download = function(uri, filename, callback) {
    request.head(uri, function(err, res, body) {
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);
 
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};
 
client.on('message', function(message) {
    const member = message.member;
    const mess = message.content.toLowerCase();
    const args = message.content.split(' ').slice(1).join(' ');
 
    if (mess.startsWith(prefix + 'play')) {
        if (!message.member.voiceChannel) return message.channel.send(':no_entry_sign:|| ** __Your not On the Room where the bot is __** ');
        // if user is not insert the URL or song title
        if (args.length == 0) {
            let play_info = new Discord.RichEmbed()
                .setAuthor(client.user.username, client.user.avatarURL)
                .setFooter('Recommended: ' + message.author.tag)
                .setDescription('**قم بإدراج رابط او اسم الأغنيه**')
            message.channel.sendEmbed(play_info)
            return;
        }
        if (queue.length > 0 || isPlaying) {
            getID(args, function(id) {
                add_to_queue(id);
                fetchVideoInfo(id, function(err, videoInfo) {
                    if (err) throw new Error(err);
                    let play_info = new Discord.RichEmbed()
                        .setAuthor(client.user.username, client.user.avatarURL)
                        .addField(':notes: Added to List', `**
                          ${videoInfo.title}
                          **`)
                        .setColor("#a637f9")
                        .setFooter('|| ' + message.author.tag)
                        .setThumbnail(videoInfo.thumbnailUrl)
                    message.channel.sendEmbed(play_info);
                    queueNames.push(videoInfo.title);
                    now_playing.push(videoInfo.title);
 
                });
            });
        }
        else {
 
            isPlaying = true;
            getID(args, function(id) {
                queue.push('placeholder');
                playMusic(id, message);
                fetchVideoInfo(id, function(err, videoInfo) {
                    if (err) throw new Error(err);
                    let play_info = new Discord.RichEmbed()
                        .setAuthor(client.user.username, client.user.avatarURL)
                        .addField('__:notes: Added  __', `**${videoInfo.title}
                              **`)
                        .setColor("RANDOM")
                        .addField(`Recommended`, message.author.username)
                        .setThumbnail(videoInfo.thumbnailUrl)
 
                    // .setDescription('?')
                    message.channel.sendEmbed(play_info)
                    message.channel.send(`**  __:notes:Playing__   ${videoInfo.title}**  `)
                    // client.user.setGame(videoInfo.title,'https://www.twitch.tv/Abdulmohsen');
                });
            });
        }
    }
    else if (mess.startsWith(prefix + 'skip')) {
        if (!message.member.voiceChannel) return message.channel.send(':no_entry_sign:|| ** __Your not On the Room where the bot is.. __**');
        message.channel.send('**__Skiped.__**').then(() => {
            skip_song(message);
            var server = server = servers[message.guild.id];
            if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
        });
    }
    else if (message.content.startsWith(prefix + 'vol')) {
        if (!message.member.voiceChannel) return message.channel.send(':no_entry_sign:|| ** __Your not On the Room where the bot is.. __**');
        // console.log(args)
        if (args > 100) return message.channel.send(':no_entry_sign: Volume must be a valid integer between 0 and 100!')
        if (args < 1) return message.channel.send(':no_entry_sign: Volume must be a valid integer between 0 and 100!')
        dispatcher.setVolume(1 * args / 50);
        message.channel.sendMessage(`**__ ${dispatcher.volume*50}% مستوى الصوت __**`);
    }
    else if (mess.startsWith(prefix + 'pause')) {
        if (!message.member.voiceChannel) return message.channel.send(':no_entry_sign:|| ** __Your not On the Room where the bot is..__**');
        message.channel.send('**__Paused.__**').then(() => {
            dispatcher.pause();
        });
    }
    else if (mess.startsWith(prefix + 'resume')) {
        if (!message.member.voiceChannel) return message.channel.send(':no_entry_sign:|| ** __Your not On the Room where the bot is..__**');
            message.channel.send('**__Resumed.__**').then(() => {
            dispatcher.resume();
        });
    }
    else if (mess.startsWith(prefix + 'leave')) {
        if (!message.member.voiceChannel) return message.channel.send(':no_entry_sign:|| ** __Your not On the Room where the bot is..__**');
        message.channel.send('**__Done.__**');
        var server = server = servers[message.guild.id];
        if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
    }
    else if (mess.startsWith(prefix + 'join')) {
        if (!message.member.voiceChannel) return message.channel.send(':no_entry_sign:|| ** __Your not On the Room where the bot is bot__**');
        message.member.voiceChannel.join().then(message.channel.send('**__Joined .__**'));
    }
    else if (mess.startsWith(prefix + 'play')) {
        if (!message.member.voiceChannel) return message.channel.send(':no_entry_sign:|| ** __Your not On the Room where the bot is..__**');
        if (isPlaying == false) return message.channel.send(':anger: || **__تم التوقيف__**');
        let playing_now_info = new Discord.RichEmbed()
            .setAuthor(client.user.username, client.user.avatarURL)
            .addField('تمت إضافةالاغنيه بقائمة الإنتظار', `**
                  ${videoInfo.title}
                  **`)
            .setColor("RANDOM")
            .setFooter('Rocommended: ' + message.author.tag)
            .setThumbnail(videoInfo.thumbnailUrl)
        //.setDescription('?')
        message.channel.sendEmbed(playing_now_info);
    }
});
 
function skip_song(message) {
    if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');
    dispatcher.end();
}
 
function playMusic(id, message) {
    voiceChannel = message.member.voiceChannel;
 
 
    voiceChannel.join().then(function(connectoin) {
        let stream = ytdl('https://www.youtube.com/watch?v=' + id, {
            filter: 'audioonly'
        });
        skipReq = 0;
        skippers = [];
 
        dispatcher = connectoin.playStream(stream);
        dispatcher.on('end', function() {
            skipReq = 0;
            skippers = [];
            queue.shift();
            queueNames.shift();
            if (queue.length === 0) {
                queue = [];
                queueNames = [];
                isPlaying = false;
            }
            else {
                setTimeout(function() {
                    playMusic(queue[0], message);
                }, 500);
            }
        });
    });
}
 
function getID(str, cb) {
    if (isYoutube(str)) {
        cb(getYoutubeID(str));
    }
    else {
        search_video(str, function(id) {
            cb(id);
        });
    }
}
 
function add_to_queue(strID) {
    if (isYoutube(strID)) {
        queue.push(getYoutubeID(strID));
    }
    else {
        queue.push(strID);
    }
}
 
function search_video(query, cb) {
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, function(error, response, body) {
        var json = JSON.parse(body);
        cb(json.items[0].id.videoId);
    });
}
 
 
function isYoutube(str) {
    return str.toLowerCase().indexOf('youtube.com') > -1;
}
 


client.on('message', message => {
if (message.content === 'Zhelp'){
message.author.send(`
**Zam | ♪ ..** commands:


\`${prefix}ping\` - **checks the bot's latency**

  __Music__

\`${prefix}nowplaying\` - **shows the song that is currently playing**
\`${prefix}play\` - **plays the provided song**
\`${prefix}queue\` - **shows the current queue**
\`${prefix}skip\` - **skip the current song**
\`${prefix}Stop\` - **Stop the current song**
\`${prefix}vol\` - **set volume Bot**
\`${prefix}pause\` - **pauses the current song**
\`${prefix}resume\` - **mresume the current song**
\`${prefix}join\` - **Join To Room**
\`${prefix}leave\` - **Leave From Room**

__Owner__

\`${prefix}setavatar <url> \` - **sets the avatar of the bot**
\`${prefix}setname <name>\` - **sets the name of the bot**
\`${prefix}Streaming\` - **Change Game Bot to Stream**
\`${prefix}watching\` - **Change Game Bot to Watching**
\`${prefix}playing\` - **Change Game Bot to Playing**
\`${prefix}listening\` - **Change Game Bot to listening**
\`${prefix}shutdown\` - **safely shuts down**

For additional help, contact **- َBaazçhy .#9999**

`);
}});
 



 client.on('message',async message => {
      if(message.content.startsWith("Zrestart")){
		  if(message.author.id !== "459203545468764160") return message.reply('You aren\'t the bot owner.');
        message.channel.send('**Restarting.**').then(msg => {
            setTimeout(() => {
               msg.edit('**Restarting..**');
            },1000);
            setTimeout(() => {
               msg.edit('**:white_check_mark: **').then(message =>{message.delete(5000)})
            },2000);
        });
        console.log(`Restarting..`);
        setTimeout(() => {
            client.destroy();
        },3000);
    }
});





client.on('message', message => {
       if (message.content === prefix + "about") {// This Code Edit By Mazchy . 
       
    (`Hello Im **- َZam . Music Bot** :notes: 
    
    **im owned By** - َBaazçhy .#9999
  
    **Type \`${prefix}help\` to see my commands!**
    
    **Plase invite Me To Your Server !**
    `)  
     .setFooter('Requested by '+message.author.username, message.author.avatarURL)
  .setURL('https://discordapp.com/oauth2/authorize?client_id=465693387253874694&scope=bot&permissions=2080374975')
    message.channel.sendEmbed(embed);
      }
  });

 
  client.on('message' , message => {
    if (message.content.startsWith(prefix + "shutdown")) {
        if(message.author.id !== "331081268731052042") return message.reply('**You aren\'t the bot owner.**');
        if ((r=>[""].includes(r.name)) ) {
                     message.channel.sendMessage("**Currently Shutting down...** ") // This Code Edit By Mazchy . 
        setTimeout(function() {
            client.destroy();
            process.exit(0);
        }, 2000);
        } else {

            return message.reply(`I cannot do that for you unfortunately`)
                .then(message => {
                    message.delete(10000);
                }).catch(console.log);
        }
       
    }
});
  








const adminprefix = "Z";
const devs = ['331081268731052042','4459203545468764160'];
client.on('message', message => {
  var argresult = message.content.split(` `).slice(1).join(' ');
    if (!devs.includes(message.author.id)) return;
    
if (message.content.startsWith(adminprefix + 'playing')) {
  client.user.setGame(argresult);
    message.channel.sendMessage(`Playing Now: **${argresult}**`).then(message =>{message.delete(5000)})
} else 
  if (message.content.startsWith(adminprefix + 'name')) {
client.user.setUsername(argresult).then
    message.channel.sendMessage(`Username Changed To **${argresult}**`).then(message =>{message.delete(5000)})

} else
  if (message.content.startsWith(adminprefix + 'avatar')) {
client.user.setAvatar(argresult);
  message.channel.sendMessage(`Avatar Changed :white_check_mark:  `).then(message =>{message.delete(5000)});
      } else     
if (message.content.startsWith(adminprefix + 'stream')) {
  client.user.setGame(argresult, "https://www.twitch.tv/Baktash_183");
    message.channel.sendMessage(`Streaming Now: **${argresult}**`).then(message =>{message.delete(5000)})
}

});
    


client.on('message', message => {
if(!message.channel.guild) return;
if (message.content.startsWith("bping")) {
    message.channel.sendMessage(`**Time Taken : **\`${Date.now() - message.createdTimestamp} ms\`
**Discord API :** \`${Math.round(client.ping)}\` `);
    }
});
  

 
client.login(process.env.BOT_TOKEN);
