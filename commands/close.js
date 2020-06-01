const Discord = require("discord.js");

exports.run = async (client, message, args) => {
    let doc = client.models.ticket.findOne({ ticket: message.channel.id });
    if(!message.channel.parent || message.channel.parent.id !== client.config.order_parent) return;
    
    let embed = new Discord.MessageEmbed()
    .setDescription(`To close this ticket, type \`confirm\` in the chat.\nYou have a total of 10 seconds to do so.`)
    .setColor(client.config.color)
    let m = await message.channel.send(embed);

    message.channel.awaitMessages(msg => msg.author.id === message.author.id && msg.content === 'confirm', { max: 1, time: 10000, errors: ['time'] }).then(async() => {
        let closeEmbed = new Discord.MessageEmbed()
        .setAuthor(`Order Channel`, message.author.displayAvatarURL)
        .setDescription(`Order Channel will be closed in 5 seconds.`)
        .setColor(client.config.color);
        message.channel.send(closeEmbed).then(r => r.delete({timeout: 4500}));

        setTimeout(() => {
            m.delete();
            message.channel.setParent(client.config.close_parent);
            message.channel.setName("🛑-order-closed");
        }, 5000);
    }).catch(() => m.delete());
    
}