const Discord = require('discord.js');

exports.run = async(client, message, args) => {
    let option = args[0];
    let options = ['tickets', 'verify']

    let wrongUsage = new Discord.MessageEmbed()
    .setTitle(``)


    if(!option || !options.includes(option)) return message.channel.send(wrongUsage);

}