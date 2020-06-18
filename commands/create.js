const Discord = require('discord.js');
const fs = require("fs");

exports.run = async(client, message, args) => {
    let option = args[0];
    let options = ['tickets', 'verify', `front-desk`];

    if(!args[0] || !options.includes(args[0])) return message.channel.send(`🚫 Please provide [front-desk/verify/tickets] as an argument!`);
        
    if(option === `front-desk`) {
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
    } else if(option === `verify`) {
        let terms = message.guild.channels.cache.get(client.config.terms_message);
        let embed = new Discord.MessageEmbed()
        .setTitle(`Verification`)
        .setColor(client.config.color)
        .setDescription(`Please click to the 💻 below to get access to our entire discord.\nBy doing so you agree to our ${terms}.`)
        .setThumbnail(`http://questdevelopment.net/assets/images/icon.png`)
        let m = await message.channel.send(embed);
        m.react("💻");
        
        let config = JSON.parse(fs.readFileSync('./config.json'));
        config.verifyMessage = m.id;
        fs.writeFileSync('./config.json', JSON.stringify(config));
    } else if(option === `tickets`) {
        let embed = new Discord.MessageEmbed()
        .setTitle(`Ticket Creation`)
        .setColor(client.config.color)
        .setDescription(`To start an order click the 📝\nTo start an application click the 📜\n To get support or help click the 💡`)
        .setThumbnail(`http://questdevelopment.net/assets/images/icon.png`)
        let m = await message.channel.send(embed);
        m.react("📝"); m.react("📜"); m.react("💡");
        
        let config = JSON.parse(fs.readFileSync('./config.json'));
        config.ticket_id = m.id;
        fs.writeFileSync('./config.json', JSON.stringify(config));
    }
}