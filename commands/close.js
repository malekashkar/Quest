const Discord = require("discord.js");

exports.run = async (client, message, args) => {
    if(!message.member.roles.cache.some(r => ["📈 Sales Representative", "💼 Manager","👑 COO", "👑 CEO", "💻 developers","✔️ Verified", 'Admin'].includes(r.name))) return;
    if(!message.channel.name.startsWith("📝-order-")) return;

    let embed = new Discord.MessageEmbed()
    embed.setDescription(`To close this ticket, type \`confirm\` in the chat.\nYou have a total of 10 seconds to do so.`);
    embed.setColor(client.config.color);

    message.channel.send(embed).then((m) => {
        message.channel.awaitMessages(msg => msg.author.id === message.author.id && msg.content === 'confirm', { max: 1, time: 10000, errors: ['time'] }).then(async() => {
            let closeEmbed = new Discord.MessageEmbed()
            .setAuthor(`Order Channel`, message.author.displayAvatarURL)
            .setDescription(`Order Channel will be closed in 5 seconds`)
            .setColor(client.config.color);
            message.channel.send(closeEmbed).then(r => r.delete({timeout: 5000}));

            setTimeout(() => {
                m.delete();
                message.channel.setParent(client.config.close_parent);
                message.channel.setName("🛑-order-CLOSED");
            }, 6000);
        }).catch(() => {
            m.edit('Ticket close timed out, the ticket was not closed.');
            m.delete({timeout: 5000})
        });
    });
}