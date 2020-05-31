const Discord = require("discord.js");
const paypal = require("paypal-rest-sdk");
const moment = require("moment");

module.exports = async(client, reaction, user) => {
    if(user.bot) return;
    if(reaction.message.partial) await reaction.message.fetch();

    let message = reaction.message;

    paypal.configure({
        "mode": "live",
        "client_id": "AT0Vv2YmpROshJVqqvjI94gqRCS6aLuZXs2Lja4S_yOUVIln5HnppL1R9O_C6yKjiee8eF1z-V_msF0J",
        "client_secret": "EKOzJP-WDkWGKNoCFaRrm8pB_aVJKgJ8OMyUPRNEBnNkBSdL4eyxGMlKvSkvCfbrZF-H6iT1jCZwpXUP"
    });

    if (reaction.emoji.name === '🏦') {
        if (message.embeds[0].footer.text === "Invoice") {
            reaction.users.remove(user);
            const invoice = message.embeds[0].fields[0].value;

            paypal.invoice.get(invoice, async(err, invoice) => {
                let errEmbed = new Discord.MessageEmbed()
                .setTitle("Invoice Unpaid.")
                .setDescription("The invoice is still unpaid, please complete the payment.")
                .setColor("RED")
                if(err) return message.channel.send(errEmbed).then(a => a.delete({timeout: 7000}))
                
                if (invoice.status === "PAID") {
                    let completeEmbed = new Discord.MessageEmbed()
                    .setTitle("Payment Verified!")
                    .setDescription("Congratulations the invoice has been paid!")
                    .setColor(3066993)
                    message.edit(completeEmbed)
                    message.reactions.removeAll();
                } else if (invoice.status == "SENT") {
                    let unpaidEmbed = new Discord.MessageEmbed()
                    .setTitle("Invoice Unpaid.")
                    .setDescription("The invoice is still unpaid, please complete the payment.")
                    .setColor("RED")
                    message.channel.send(unpaidEmbed).then(m => m.delete(8000));
                }
            });
         }
    }

    if (message.id === client.config.ticket_id) {
        reaction.users.remove(user);

        if (reaction.emoji.name === '📝') {
            let seq = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
            let chan = await message.guild.channels.create(`📝-order-${seq}`);

            chan.setParent(client.config.order_parent);
            chan.createOverwrite(message.guild.id, { VIEW_CHANNEL: false });;
            chan.createOverwrite(user, { VIEW_CHANNEL: true, SEND_MESSAGES: true });
            chan.setTopic(`${user.id}`);

            let users = [];

            message.guild.roles.cache.get('652633724709765155').members.forEach(m => users.push(m.id));
            let showUserTags = message.guild.roles.cache.get('652633724709765155').members.map(m => m.user.tag).join('\n');

            let collector = chan.createMessageCollector(m => m.author.id === user.id), index = 0;
            let questions = [`**Please @ the 📈 Sales Representative that got you to join Quest**\n\nList of Sales Representative : \`\`\`${showUserTags}\`\`\``, `**What role are you requesting**\n\`\`\`[ Developers ] \n 💻 Java Developer \n 💻 Expedited Developer \n 💻 Web Developer \n 💻 Bot Developer \n 💻 Jar Developer \n 💻 Forge Developer \n 💻 Sys Admin \n 💻 Configurator\`\`\``, `Tell us a bit about what you're requesting.`, `What is your budget?`, `What is your deadline?`, `Do you have any extra information?`, `Do you have any examples? (Please use an https://imgur.com link)`]

            let embed = new Discord.MessageEmbed()
            .setColor("#00BBE8")
            .setTitle(`Answer the following question.`)
            .setDescription(questions[index])
            .setFooter(`You have 16 minutes to answer the question.`)
            chan.send(embed);

            collector.on('collect', m => {
                if(index + 1 === questions.length) return collector.stop();
                embed.setDescription(questions[++index]);
                chan.send(embed);
            });

            collector.on('end', async collected => {
                let arrayX = collected.array();

                const fetched = await chan.messages.fetch({limit: 50});
                chan.bulkDelete(fetched);

                let collectedEmbed = new Discord.MessageEmbed()
                .setColor(client.config.color)
                .setTitle("Commission")
                .addField("**Channel Name**", `<#${chan.id}>`)
                .addField("**Sales Representative**", arrayX[0].mentions.members.first())
                .addField("**What role are you requesting**", arrayX[1].content)
                .addField("Details", arrayX[2].content)
                .addField("Budget", arrayX[3].content)
                .addField("Deadline", arrayX[4].content)
                .addField("Extra Info", arrayX[5].content)
                .addField("Examples", arrayX[6].content)
                .setFooter(chan.id);
                chan.send(collectedEmbed).then(m => m.pin())

                // chan.createOverwrite(arrayX[0].mentions.members.first().id, { SEND_MESSAGES: true, VIEW_CHANNEL: true });
                chan.send("<@&"+ client.config.manager_role +">").then(u => u.delete({timeout: 1000}))
            });
        }
    }

    if(message.id === client.config.front_desk) {
        reaction.users.remove(user);

        if(reaction.emoji.name === "✅") {
            let doc = await client.models.timesheet.findOne({
                user: message.author.id,
                status: `open`
            });

            let wrong = new Discord.MessageEmbed()
            .setTitle(`Please make sure you end working before you begin working.`)
            .setColor(`#FF6347`)
            if(doc) return user.send(wrong);

            let userStarted = new Discord.MessageEmbed()
            .setTitle(`You have signed-in to a session.`)
            .addField(`Login Time`, moment(Date.now()).format('DD/MM/YYYY hh:mm:ss A'))
            .setColor(client.config.color)
            user.send(userStarted);

            new client.models.timesheet({
                user: message.author.id,
                login: Date.now(),
                logout: 0,
                totalTime: 0,
                status: `open`
            }).save();
        } else if(reaction.emoji.name === "🚫") {
            let timeChannel = message.guild.channels.cache.get(client.config.time_reports);
            if(!timeChannel) return;
            
            let doc = await client.models.timesheet.findOne({
                user: message.author.id,
                status: `open`,
                logout: 0,
                totalTime: 0,
            });

            let wrong = new Discord.MessageEmbed()
            .setTitle(`Please make sure you begin working before you end working.`)
            .setColor(`#FF6347`)
            if(!doc) return user.send(wrong);

            let serverSend = new Discord.MessageEmbed()
            .setTitle(`Signed Out`)
            .setDescription(`${user} has signed-out of working.`)
            .addField(`Login Time`, moment(doc.login).format('DD/MM/YYYY hh:mm:ss A'), true)
            .addField(`Logout Time`, moment(Date.now()).format('DD/MM/YYYY hh:mm:ss A'), true)
            .addField(`Session Time`, moment(Date.now() - doc.login).format('DD/MM/YYYY hh:mm:ss A'), true)
            .setColor(client.config.color)

            let userSend = new Discord.MessageEmbed()
            .setTitle(`You have signed-out of working.`)
            .addField(`Login Time`, moment(doc.login).format('DD/MM/YYYY hh:mm:ss A'), true)
            .addField(`Logout Time`, moment(Date.now()).format('DD/MM/YYYY hh:mm:ss A'), true)
            .addField(`Session Time`, moment(Date.now() - doc.login).format('DD/MM/YYYY hh:mm:ss A'), true)
            .setColor(client.config.color)

            user.send(userSend);
            timeChannel.send(serverSend);

            doc.logout = Date.now();
            doc.totalTime = Date.now() - doc.login;
            doc.status = `closed`;
            doc.save();
        }
    }

    if(message.id === client.config.verifyMessage) {
        reaction.users.remove(user);
        if(reaction.emoji.name === "💻") {
            let member = message.guild.members.cache.get(user.id);
            let role = message.guild.roles.cache.get(client.config.verified);
            let removeRole = message.guild.roles.cache.get(client.config.unverified);

            member.roles.remove(removeRole);
            member.roles.add(role);
        }
    }
}

