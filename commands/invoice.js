const Discord = require("discord.js");
const paypal = require("paypal-rest-sdk");

exports.run = async (client, message, args) => {
    if (!message.member.roles.cache.some(r => ["📈 Sales Representative", "💼 Manager","👑 COO", "👑 CEO", "💻 developers", "✔️ Verified"].includes(r.name))) return;
    if (!message.channel.name.startsWith("📝-order-")) return message.channel.send("You can only do this command in a ticket!").then(message => message.delete(8000));
    if (!args[0]) return message.channel.send(new Discord.MessageEmbed().setTitle("Error").setDescription(`Invalid Usage: \`-invoice <amount>\``).setColor("#FF0000"));
    
    let price = parseInt(parseInt(args[0]) * 1.20);

    paypal.configure({
        "mode": "live",
        "client_id": "AT0Vv2YmpROshJVqqvjI94gqRCS6aLuZXs2Lja4S_yOUVIln5HnppL1R9O_C6yKjiee8eF1z-V_msF0J",
        "client_secret": "EKOzJP-WDkWGKNoCFaRrm8pB_aVJKgJ8OMyUPRNEBnNkBSdL4eyxGMlKvSkvCfbrZF-H6iT1jCZwpXUP"
    });
    
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
            .setDescription(`Click [here](https://www.paypal.com/invoice/payerView/details/${invoice.id}) to pay the invoice.`)
            .setThumbnail("https://www.questdevelopment.net/assets/images/icon.png")
            .setColor(client.config.color)
            message.channel.send(embed).then(m => m.react("🏦"));
        });
    });
}