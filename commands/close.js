const Discord = require("discord.js");
const fs = require("fs");

exports.run = async (client, message, args) => {
    let doc = await client.models.ticket.findOne({ ticket: message.channel.id });
    let categories = [`717422225627807815`, `702327034717929492`, `654425354165026846`, `717422387624149052`, `717422513533091851`, `717422875618836540`, `717422948541005914`]; // Support, orders.
    if(!message.channel.parent || !categories.includes(message.channel.parent.id)) return;

    let payRest = new Discord.MessageEmbed()
    .setTitle(`Rest of Payment`)
    .setDescription(`You cannot close this ticket before 100% of the order is paid!\nPlease run the \`-invoice <amount>\` command before closing this ticket.`)
    .setColor(client.config.color);

    let confirmEmbed = new Discord.MessageEmbed()
    .setDescription(`To close this ticket, type \`confirm\` in the chat.\nYou have a total of 10 seconds to do so.`)
    .setColor(client.config.color)

    let closingEmbed = new Discord.MessageEmbed()
    .setTitle(`Order Channel`)
    .setDescription(`Order Channel will be closed in 5 seconds.`)
    .setColor(client.config.color);

    if(message.channel.parent.name.includes("Commissions")) {
        let m = await message.channel.send(confirmEmbed);

        message.channel.awaitMessages(m => m.content === "confirm", { max: 1, time: 10000, errors: ['time'] }).then(async u => {
            let r = await message.channel.send(closingEmbed);
            transcript(message.channel.topic);
            m.delete(); u.first().delete();

            setTimeout(async() => {
                r.delete();
                message.channel.setParent(client.config.close_parent);
                message.channel.setName("🛑-support-closed");

                let perms = await message.channel.permissionOverwrites;
                perms.forEach(u => u.delete());
                message.channel.createOverwrite(message.guild.id, {VIEW_CHANNEL: false});
            }, 5000);
        }).catch(() => m.delete());

        let user = message.guild.members.cache.get(doc.user);
        if([0, 50].includes(doc.percent)) return message.channel.send(payRest).then(m => m.delete(10000));

        let developer = message.guild.members.cache.get(doc.developer);
        let paymentChannel = await message.guild.channels.create(`'${developer.user.username}-payment`);
        
        paymentChannel.setparent(client.config.payment_parent);

        let paymentEmbed = new Discord.MessageEmbed()
        .setTitle(`Payment Information`)
        .setDescription(`The total amount owed to this developer is **$${doc.paid}**`)
        .setFooter(`Developer Payments`)
        .setTimestamp()
        .setColor(client.config.color)
        paymentChannel.send(paymentEmbed);

        transcript(doc.user);

        /* Ask the questions below */
        let qEmbed = new Discord.MessageEmbed()
        .setColor(client.config.color)
        .setTitle(`Answer the following question.`)
        .setFooter(`You have 16 minutes to answer the question.`);

        qEmbed.setDescription(`Are you willing to write a review for our services?`);
        let a = await user.send(qEmbed); a.react("✅"); a.react("🚫");

        let eCollector = a.createMessageCollector((reaction, user) => ["✅", "🚫"].includes(reaction.emoji.name), { max: 1 });
        eCollector.on('collect', async(reaction, user) => {
            if(reaction.emoji.name === "✅") {
                qEmbed.setDescription(`How would you rate our service from 1-5?`)
                user.send(qEmbed);

                let collector = user.dmChannel.createMessageCollector(m => m.author.id === message.author.id && ["1", "2", "3", "4", "5"].includes(m.content), { max: 1 });
                collector.on('collect', async m => {
                    let rating = Number(m.content);

                    qEmbed.setDescription(`Please write out a short review.`)
                    user.send(qEmbed);

                    let collector = user.dmChannel.createMessageCollector(m => m.author.id === message.author.id, { max: 1 });
                    collector.on('collect', async m => {
                        let review = m.content;

                        let stars = "";
                        for(let i = 0; i < rating; i++) stars += `⭐`; 

                        let reviewChannel = message.guild.channels.cache.get(client.config.review_channel);
                        if(!reviewChannel) return;

                        let reviewEmbed = new Discord.MessageEmbed()
                        .setTitle(`Service Review`)
                        .setDescription(`Review: ${review}`)
                        .setThumbnail(user.displayAvatarURL())
                        .addField(`Rating`, stars, true)
                        .addField(`Client`, `${user}`, true)
                        .addField(`Developer`, message.guild.members.cache.get(doc.developer));
                        reviewChannel.send(reviewEmbed);

                        doc.remove();
                });
            });
            } else {
                let embed = new Discord.MessageEmbed()
                .setTitle(`Two Question Review`)
                .setDescription(`Thanks for your time, we hope you see you back at **Quest Development** soon!`)
                .setColor(client.config.color)
                .setThumbnail(`https://www.questdevelopment.net/assets/images/icon.png`)
                .setFooter(client.user.username)
                .setTimestamp()
                user.send(embed);

                transcript(doc.user);
                doc.remove();
            }
        })
    }

    function transcript(clientID) {
        let clientel = client.users.cache.get(clientID);

        message.channel.messages.fetch({ limit: 100 }).then(msg => {
            let text = "";
            
            for (let [key, value] of msg) {
                const date = new Date(value.createdTimestamp);
                let dateString = `${date.getDate()}/${date.getMonth()}/${date.getYear()} @ ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
                text += `${value.author.tag} | ${dateString}<br />${value.content}<br /><br />`;
            }
            
            let htmlText = `<!DOCTYPE html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="https://fonts.googleapis.com/css2?family=Titillium+Web&display=swap" rel="stylesheet">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                    }
            
                    body {
                        background-color: #2C2F33;
                        font-family: 'Courier New', Courier, monospace;
                        color: white;
                    }
            
                    #container {
                        display: block;
                        margin: 0 auto;
                        width: 50vw;
                        min-height: 100vh;
                        background-color: #23272A;
                    }
            
                    #info {
                        background-color: #7289DA;
                        padding: 30px;
                        text-align: center;
                    }
            
                    .highlight {
                        color: gold;
                    }
            
                    #messages {
                        font-family: 'Titillium Web', sans-serif;
                        padding: 30px;
                    }
                </style>
            </head>
            
            <body>
                <div id="container">
                    <div id="info">
                        <h2>Quest Development Chat Logs</h2><br />
                        <p>Ticket Information</p><br />
                        <p>User: <span class="highlight">${clientel.tag}</span></p>
                        <p>Server: <span class="highlight">${message.guild.name}</span></p>
                        <p>Closed By: <span class="highlight">${message.author.tag}</span></p>
                    </div>
                    <div id="messages">
                        <p>${text}</p>
                    </div>
                </div>
            </body>
            </html>`;
            
            fs.writeFile(`./transcripts/${message.channel.name}.html`, htmlText, err => {
                if (err) throw err;
            });

            let transFile = `./transcripts/${message.channel.name}.html`;
            clientel.send({files: [transFile]});
        });
    }
}