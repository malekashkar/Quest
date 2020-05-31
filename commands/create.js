const Discord = require('discord.js');
const fs = require("fs");

exports.run = async(client, message, args) => {
    let option = args[0];
    let options = ['tickets', 'verify', `front-desk`];
    
    if(!option || !options.includes(option)) return message.channel.send(wrongUsage);
    
    if(option === options[2]) {
        let embed = new Discord.MessageEmbed()
        .setTitle(`Front Desk`)
        .setColor(client.config.color)
        .setDescription(`*To login when you begin your code, click the ✅.*\n*When you are complete with coding, click the 🚫 to log out.*\n\nKeep in mind, your work between this time will be reviewed.`)
        .setThumbnail(`http://questdevelopment.net/assets/images/icon.png`)
        let m = await message.channel.send(embed);
        m.react("✅"); m.react("🚫");  
        
        let config = JSON.parse(fs.readFileSync('./config.json'));
        config.front_desk = m.id;
        fs.writeFileSync('./config.json', JSON.stringify(config));
    }
}