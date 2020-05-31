const Discord = require("discord.js");
const paypal = require("paypal-rest-sdk");

exports.run = async (client, message, args) => {
    if (!message.member.roles.some(r => ["📈 Sales Representative", "💼 Manager","👑 COO", "👑 CEO", "💻 developers", "✔️ Verified"].includes(r.name))) return;
    if (!message.channel.name.startsWith("📝-order-")) return message.channel.send("You can only do this command in a ticket!").then(message => message.delete(8000));
    if (!args[0]) return message.channel.send(new Discord.MessageEmbed().setTitle("Error").setDescription(`Invalid Usage: \`-invoice <email-address> <amount in number>\``).setColor("#FF0000"));
    
    let theamount;
    let thefees;
    if (!args[0] || !args[1]) return message.channel.send(new Discord.MessageEmbed().setTitle("Error").setDescription(`Invalid Usage: \`-invoice <email-address> <amount in number>\``).setColor("#FF0000"));
    
    let answer = validateEmail(args[0])
    if (answer !== true) return message.channel.send(new Discord.MessageEmbed().setTitle("Error").setDescription(`Invalid Email Address Provided: \`-invoice <email-address> <amount in number>\``).setColor("#FF0000"));
    if (isNaN(args[1]) || args[1] < 1) return message.channel.send(new Discord.MessageEmbed().setTitle("Error").setDescription(`Invalid Amount Provided: \`-invoice <email-address> <amount in number>\``).setColor("#FF0000"));
    
    if (args[2] >= 100) {
        theamount = (5 / 100 * parseInt(args[1]) + parseInt(args[1]) + 0.06).toFixed(2);
        thefees = 5 / 100 * parseInt(args[1]) + 0.06
    } else {
        theamount = (15 / 100 * parseInt(args[1]) + parseInt(args[1]) + 0.06).toFixed(2);
        thefees = 15 / 100 * parseInt(args[1]) + 0.06
    }

    paypal.configure({
        "mode": "live",
        "client_id": "AT0Vv2YmpROshJVqqvjI94gqRCS6aLuZXs2Lja4S_yOUVIln5HnppL1R9O_C6yKjiee8eF1z-V_msF0J",
        "client_secret": "EKOzJP-WDkWGKNoCFaRrm8pB_aVJKgJ8OMyUPRNEBnNkBSdL4eyxGMlKvSkvCfbrZF-H6iT1jCZwpXUP"
    });
    
    var create_invoice_json = {
        "merchant_info":{
           "email":"twisor2001s@gmail.com",
           "first_name":"Takoma",
           "last_name":"Wisor",
           "business_name":"Quest Development"
        },
        "billing_info":[
           {
              "email":"`${args[0]}`"
           }
        ],
        "items":[
           {
              "name":"Custom Product\nOrdered from Quest Development",
              "quantity":1.0,
              "unit_price":{
                 "currency":"USD",
                 "value": "args"[1]  
              }
           }
        ],
        "custom": {
           "label":"Fees",
           "amount":{
              "currency":"USD",
              "value": thefees.toFixed(2).toString()
           }
        },
        "terms":"By paying this invoice you accept to are TOS - https://docs.google.com/document/d/1FcsqEcdfgTWFAfmHbsNIBXKKn6XlLSFohpCpcmzpOSQ/edit?usp=sharing",
        "tax_inclusive":false,
        "total_amount":{
           "currency":"USD",
           "value":"args"[1]
        }
     }

    let msg = await message.channel.send(new Discord.MessageEmbed().setTitle("Generating Invoice").setDescription("Generating an invoice, please wait.").setColor("#FFB14F"));
    
    paypal.invoice.create(create_invoice_json, async function (err, invoice) {
        if(err) return console.log(err);

        paypal.invoice.send(invoice.id, async function (err, rv) {
            if (error) return console.log(err)

            let embed = new Discord.MessageEmbed()
            .setTitle("Invoice Created!")
            .setDescription(`The invoice has been emailed to **${args[0]}**\nClick [here](https://www.paypal.com/invoice/payerView/details/${invoice.id}) to pay for it.`).addField("Invoice ID", `${invoice.id}`)
            .setThumbnail("https://www.questdevelopment.net/assets/images/icon.png")
            .setColor(client.config.color)
            msg.edit(embed).then(m => m.react("🏦"));
        });
    });

    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
}