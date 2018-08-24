const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require('ytdl-core');
const request = require('request');
const fs = require('fs');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
 
const yt_api_key = "AIzaSyDeoIH0u1e72AtfpwSKKOSy3IPp2UHzqi4";
const prefix = '-';
client.on('ready', function() {
    client.user.setGame(` Baktash . `,"http://twitch.tv/Baktash_183")
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
                        .addField('تمت إضافةالاغنيه بقائمة الإنتظار', `**
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
     if (message.content === prefix +"help") {
    const embed = new Discord.RichEmbed()
     .setColor("RANDOM")
     .addField(`**__أوامر البوت__**`,`
         **${prefix}join**
     عشان يدخل البوت الروم
         **${prefix}leave**
         خروج البوت من الروم     
         **${prefix}play**
     امر تشغيل الأغنية , kplay الرابط او اسم الأعنية
     **${prefix}skip**
     تغير الأغنية
     **${prefix}pause**
     ايقاف الأغنية
     **${prefix}resume**
     مواصلة الأغنية
     **${prefix}vol**
     مستوى الصوت 1-100
       
     PREFIX = ${prefix}
     PING = ${Date.now() - message.createdTimestamp}ms
     FOR HELP = <@331081268731052042>
     `)
 
      message.channel.send({embed});
     }
    });
 
 
const adminprefix = "-";
const devs = ['331081268731052042','385529907226345482'];
client.on('message', message => {
  var argresult = message.content.split(` `).slice(1).join(' ');
    if (!devs.includes(message.author.id)) return;
    
if (message.content.startsWith(adminprefix + 'game')) {
  client.user.setGame(argresult);
    message.channel.sendMessage(`**${argresult} ** __Done .__  The Bot Game Changed **`)
} else 
  if (message.content.startsWith(adminprefix + 'name')) {
client.user.setUsername(argresult).then
    message.channel.sendMessage(`**${argresult}** ** __Done .__  The Bot Name Changed **`)
return message.reply("**لا يمكنك تغيير الاسم يجب عليك الانتظآر لمدة ساعتين . **");
} else
  if (message.content.startsWith(adminprefix + 'avatar')) {
client.user.setAvatar(argresult);
  message.channel.sendMessage(`**${argresult}** ** __Done .__  The Bot avatar Changed **`);
      } else     
if (message.content.startsWith(adminprefix + 'stream')) {
  client.user.setGame(argresult, "https://www.twitch.tv/idk");
    message.channel.sendMessage(`**  The Bot stream Changed __Done .__ ${argresult}**`)
}

});
 
client.login(process.env.BOT_TOKEN);
