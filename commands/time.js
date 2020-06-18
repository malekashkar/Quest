const Discord = require("discord.js");
const moment = require("moment");
const ms = require("ms");

exports.run = async(client, message, args) => {
    let member = message.mentions.members.first();
    if(!member) member = message.member;

    let doc = await client.models.timesheet.findById(member.id);
    if(!doc) return message.channel.send(`🚫 ${member} has not signed into a timesheet yet!`);

    let totalTime = 0;
    for(let i = 0; i < doc.sessions.length; i++) {
        if(doc.sessions[i].logout !== 0) totalTime = (doc.sessions[i].logout - doc.sessions[i].login) + totalTime;
    };

    let role;
    if(doc.type === 'sale') role = message.guild.roles.cache.get(client.config.sales_role);
    else if(doc.type === 'dev') role = message.guild.roles.cache.get(client.config.dev_role);

    let timesheet = new Discord.MessageEmbed()
    .setColor(client.config.color)
    .setTitle(`${member.user.username} Timesheet`)
    .addField(`Total Time`, ms(totalTime), true)
    .addField(`Role`, `${role}`, true)
    .setFooter(`Quest Timesheets`)
    .setTimestamp()
    doc.status ? timesheet.addField(`Status`, `Currently Working.`, true) : timesheet.addField(`Status`, `Currently Not Working.`, true);

    if(doc.type === 'sale') {
        let length = doc.status ? doc.sessions.length - 1 : doc.sessions.length;

        for(let i = 0; i < length; i++) {
            if(doc.sessions[i].work.invites) timesheet.addField(`Session ${i + 1}`, `Login **${moment(doc.sessions[i].login).format("LT")}** | Logout **${moment(doc.sessions[i].logout).format("LT")}** | Total **${ms(doc.sessions[i].logout - doc.sessions[i].login)}** | Invites **${doc.sessions[i].work.invites}**`);
            else timesheet.addField(`Session ${i + 1}`, `Login **${moment(doc.sessions[i].login).format("LT")}** | Logout **${moment(doc.sessions[i].logout).format("LT")}** | Total **${ms(doc.sessions[i].logout - doc.sessions[i].login)}** | Invites: **0**`);
        }
    } else {
        let length = doc.status ? doc.sessions.length - 2 : doc.sessions.length - 1;

        for(let i = 0; i < length; i++) {
            timesheet.addField(`Session ${i + 1}`, `Login **${moment(doc.sessions[i].login).format("LT")}** | Logout **${moment(doc.sessions[i].logout).format("LT")}** | Total **${ms(doc.sessions[i].logout - doc.sessions[i].login)}**`);
        }
    }

    message.channel.send(timesheet);
}