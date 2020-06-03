const Discord = require("discord.js");
const paypal = require("paypal-rest-sdk");

exports.run = async (client, message, args) => {
    if (!message.member.roles.cache.some(r => ["📈 Sales Representative", "💼 Manager","👑 COO", "👑 CEO", "💻 developers"].includes(r.name))) return;
    if (!args[0]) return message.channel.send(new Discord.MessageEmbed().setTitle("Error").setDescription(`Invalid Usage: \`-invoice <amount>\``).setColor("#FF0000"));
    paypal.configure({ "mode": "live", "client_id": client.config.paypal_client_id, "client_secret": client.config.paypal_client_secret});

   let payFirst = new Discord.MessageEmbed()
   .setTitle(`Initial Payment`)
   .setDescription(`You cannot open another invoice until the first one is paid for.`)
   .setColor(client.config.color);

   let fullyPaid = new Discord.MessageEmbed()
   .setTitle(`Payments Complete`)
   .setDescription(`This order is already fully paid for!`)
   .setColor(client.config.color);

   let price = 0;
   let doc = await client.models.ticket.findOne({ ticket: message.chanel.id }).exec();
   if(doc.percent === 0) return message.channel.send(payFirst);
   if(doc.percent === 50) price = doc.price / 2;
   if(doc.percent === 100) return message.channel.send(fullyPaid);
    
    var create_invoice_json = {
        "merchant_info": {
           "email":"twisor2001s@gmail.com",
           "first_name":"Takoma",
           "last_name":"Wisor",
           "business_name":"Quest Development"
        },
        "items": [
           {
              "name":"Custom Product\nOrdered from Quest Development",
              "quantity": 1.0,
              "unit_price":{
                 "currency":"USD",
                 "value": price
              }
           }
        ],
        "terms": "By paying this invoice you accept to are TOS - https://docs.google.com/document/d/1FcsqEcdfgTWFAfmHbsNIBXKKn6XlLSFohpCpcmzpOSQ/edit?usp=sharing",
        "tax_inclusive": false,
        "total_amount": {
           "currency": "USD",
           "value": price
        }
     }
    
    paypal.invoice.create(create_invoice_json, async(err, invoice) => {
        if(err) return console.log(err);

        paypal.invoice.send(invoice.id, async(error, rv) => {
            if (error) return console.log(error);

            let embed = new Discord.MessageEmbed()
            .setTitle("Invoice Created!")
            .setDescription(`Click [here](https://www.paypal.com/invoice/payerView/details/${invoice.id}) to pay the invoice. Click the emoji once paid.`)
            .addField(`**Invoice ID**`, invoice.id, true)
            .addField(`**Price**`, `$${price}`, true)
            .setThumbnail("https://www.questdevelopment.net/assets/images/icon.png")
            .setColor(client.config.color)
            .setFooter(`Invoice`);
            message.channel.send(embed).then(m => m.react("🏦"));
        });
    });
}