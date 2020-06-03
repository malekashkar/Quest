const Discord = require("discord.js");

exports.run = async(client, message, aegs) => {
    let price;
    let doc = await client.models.ticket.findOne({ ticket: message.channel.id }).exec();
    if(!doc || ![0, 50, 100].includes(doc.percent)) return;

    if(doc.price === 0) price = `No Quote`;
    else price = `$${doc.price}`;
    
    let embed = new Discord.MessageEmbed()
    .setTitle(`Order Price Check`)
    .setDescription(`Below is the price check info of this order.`)
    .addField(`Order Total`, price, true)
    .addField(`Amount Paid`, `$${doc.paid}`, true)
    .addField(`Percent Paid`, `${doc.percent}%`, true)
    .setColor(client.config.color)
    .setTimestamp()
    message.channel.send(embed);
}