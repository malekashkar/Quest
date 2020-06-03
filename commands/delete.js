const Discord = require("discord.js");
const fs = require("fs");

exports.run = async (client, message, args) => {
    let doc = await client.models.ticket.findOne({ ticket: message.channel.id }).exec();
    let categories = [`702327034717929492`, `654425306001571840`]; // Support, orders.
    if(!message.channel.parent || !categories.includes(message.channel.parent.id)) return;

    console.log(doc.user);

    let confirmEmbed = new Discord.MessageEmbed()
    .setDescription(`To close this ticket, type \`confirm\` in the chat.\nYou have a total of 10 seconds to do so.`)
    .setColor(client.config.color)

    let closingEmbed = new Discord.MessageEmbed()
    .setTitle(`Order Channel`)
    .setDescription(`Order Channel will be closed in 5 seconds.`)
    .setColor(client.config.color);

    let m = await message.channel.send(confirmEmbed);

    message.channel.awaitMessages(m => m.content === "confirm", { max: 1, time: 10000, errors: ['time'] }).then(async u => {
        let r = await message.channel.send(closingEmbed);
        transcript(message.channel.topic);
        m.delete(); u.first().delete();

        setTimeout(async() => {
            r.delete();
            message.channel.setParent(client.config.close_parent);
            message.channel.setName("🛑-ticket-deleted");
            doc.remove();

            let perms = await message.channel.permissionOverwrites;
            perms.forEach(u => u.delete());
            message.channel.createOverwrite(message.guild.id, {VIEW_CHANNEL: false});
        }, 5000);
    }).catch(() => m.delete());
}