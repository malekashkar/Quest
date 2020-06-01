const Discord = require("discord.js");
const paypal = require("paypal-rest-sdk");
const moment = require("moment");
const ms = require("ms");

module.exports = async(client, reaction, user) => {
    if(user.bot) return;
    if(reaction.message.partial) await reaction.message.fetch();
    await user.createDM();

    let message = reaction.message;

    paypal.configure({
        "mode": "live",
        "client_id": "AT0Vv2YmpROshJVqqvjI94gqRCS6aLuZXs2Lja4S_yOUVIln5HnppL1R9O_C6yKjiee8eF1z-V_msF0J",
        "client_secret": "EKOzJP-WDkWGKNoCFaRrm8pB_aVJKgJ8OMyUPRNEBnNkBSdL4eyxGMlKvSkvCfbrZF-H6iT1jCZwpXUP"
    });

    /* Invoice Checking */
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
                    message.channel.send(unpaidEmbed).then(m => m.delete({timeout: 8000}));
                } else if(invoice.status == "UNPAID") {
                    let unpaidEmbed = new Discord.MessageEmbed()
                    .setTitle("Invoice Unpaid.")
                    .setDescription("The invoice is still unpaid, please complete the payment.")
                    .setColor("RED")
                    message.channel.send(unpaidEmbed).then(m => m.delete({timeout: 8000}));
                }
            });
         }
    }

    /* Ticket Creating */
    if (message.id === client.config.ticket_id) {
        reaction.users.remove(user);

        /* Order Creating */
        if (reaction.emoji.name === '📝') {
            let seq = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
            let chan = await message.guild.channels.create(`📝-order-${seq}`);

            chan.setParent(client.config.order_parent);
            chan.createOverwrite(message.guild.id, { VIEW_CHANNEL: false });
            chan.createOverwrite(user, { VIEW_CHANNEL: true, SEND_MESSAGES: true });
            chan.send(`${user}`).then(m => m.delete({timeout: 1000}));

            /* Ask the questions below */
            let qEmbed = new Discord.MessageEmbed()
            .setColor(client.config.color)
            .setTitle(`Answer the following question.`)
            .setFooter(`You have 16 minutes to answer the question.`);

            let emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            let commissionChannel = message.guild.channels.cache.get(client.config.commissionChannel);
            let salesReps = message.guild.roles.cache.get('652633724709765155').members.map(m => `@${m.user.tag}`);
            let devJobs = ['Java Developer', 'Web Developer', 'Bot Developer', 'Jar Developer', 'Forge Developer', 'Sys Admin', 'Configurator'];
            let questions = [`Please tag the sales rep below that brought you here.`, `What kind of developer are you requesting?`, `Please provide some detail about what you are requesting.`, `What is your deadline?`, `Do you have any more info? Such as any links that may be useful to the developer.`]

            /* First question */
            let reps = ``;
            for(let i = 0; i < salesReps.length; i++) reps += `${emojis[i]} - ${salesReps[i]}\n`;

            qEmbed.setDescription(`${questions[0]}\n\n\`\`\`${reps}\`\`\``);
            let repEmbed = await chan.send(qEmbed);
            for(let i = 0; i < salesReps.length; i++) if(!repEmbed.deleted) await repEmbed.react(emojis[i]);

            /* First Collector */
            let repCollector = repEmbed.createReactionCollector((reaction, u) => emojis.includes(reaction.emoji.name) && u.id === user.id, { max: 1 });
            repCollector.on('collect', async(reaction, user) => {
                repEmbed.delete();

                let tempArr = message.guild.roles.cache.get('652633724709765155').members.map(m => m.id);
                let salesRep = message.guild.members.cache.get(tempArr[emojis.indexOf(reaction.emoji.name)]);

                /* Second Question */
                let jobs = ``;
                for(let i = 0; i < devJobs.length; i++) jobs += `${emojis[i]} - ${devJobs[i]}\n`;

                qEmbed.setDescription(`${questions[1]}\n\n\`\`\`${jobs}\`\`\``);
                let devEmbed = await chan.send(qEmbed);
                for(let i = 0; i < devJobs.length; i++) if(!devEmbed.deleted) await devEmbed.react(emojis[i]);

                /* Second Collector */
                let devCollector = devEmbed.createReactionCollector((reaction, u) => emojis.includes(reaction.emoji.name) && u.id === user.id, { max: 1 });
                devCollector.on('collect', async(reaction, user) => {
                    devEmbed.delete();

                    let devRole = message.guild.roles.cache.find(x => x.name === `💻 ${devJobs[emojis.indexOf(reaction.emoji.name)]}`);

                    /* Third question */
                    qEmbed.setDescription(questions[2]);
                    let q1 = await chan.send(qEmbed);

                    /* Third Collector */
                    let collector = chan.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                    collector.on('collect', async m => {
                        let details = m.content;
                        m.delete();
                        q1.delete();

                        /* Fourth Question */
                        qEmbed.setDescription(questions[3]);
                        let q2 = await chan.send(qEmbed);
                        
                        /* Fourth Collector */
                        let collector = chan.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                        collector.on('collect', async m => {
                            let deadline = m.content;
                            m.delete();
                            q2.delete();

                            /* Fifth Question */
                            qEmbed.setDescription(questions[4]);
                            let q3 = await chan.send(qEmbed);
                            
                            /* Fifth Collector */
                            let collector = chan.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                            collector.on('collect', async m => {
                                let extra = m.content;
                                m.delete();
                                q3.delete();

                                let collectedEmbed = new Discord.MessageEmbed()
                                .setColor(client.config.color)
                                .setTitle("Commission")
                                .addField("**Channel Name**", `<#${chan.id}>`, true)
                                .addField("**Sales Rep**", `${salesRep}`, true)
                                .addField("**Development Type**", `${devRole}`, true)
                                .addField("**Details**", details, true)
                                .addField("**Deadline**", deadline, true)
                                .addField("**Extra**", extra, true)
                                .setFooter(chan.id);

                                let quoteInfo = new Discord.MessageEmbed()
                                .setTitle(`Incoming Quotes`)
                                .setDescription(`You will shortly receive quotes from developers.\nTo accept the quote, click the ✅.\nTo deny the quote, click the 🚫.`)
                                .setColor(client.config.color);

                                let commID = await commissionChannel.send(collectedEmbed); commID.react("💰");
                                let t = await commissionChannel.send(`${devRole}`); t.delete({timeout: 1000});
                                chan.send(collectedEmbed)
                                quoteInfo.send()
                                .then(m => m.pin())
                                chan.send("<@&"+ client.config.manager_role +">").then(u => u.delete({timeout: 1000}));

                                new client.models.ticket({
                                    "user": message.author.id,
                                    "ticket": chan.id,
                                    "commission": commID.id,
                                    "details": details,
                                    "price": 0,
                                    "type": devRole.name
                                }).save();
                            });
                        });
                    });
                });
            });
        } else if(reaction.emoji.name === "📜") {
            let seq = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
            let chan = await message.guild.channels.create(`📜-application-${seq}`);

            chan.setParent(client.config.application_parent);
            chan.createOverwrite(message.guild.id, { VIEW_CHANNEL: false });
            chan.createOverwrite(user, { VIEW_CHANNEL: true, SEND_MESSAGES: true });
            chan.send(`${user}`).then(m => m.delete({timeout: 1000}));

            /* Ask the questions below */
            let qEmbed = new Discord.MessageEmbed()
            .setColor(client.config.color)
            .setTitle(`Answer the following question.`)
            .setFooter(`You have 16 minutes to answer the question.`);

            let devJobs = ['Java Developer', 'Web Developer', 'Bot Developer', 'Jar Developer', 'Forge Developer', 'Sys Admin', 'Configurator'];
            let questions = [`What role are you applying for?`, `How old are you? `, `What is your timezone? `, `What is your portfolio link?`, `Why do you want to work for Quest Development?`, `How did you find out about Quest Development?`, `How active can you be?`, `Please list the teams that you have worked for in the past.`, `What teams are you currently working for? What position are you there?`, `Please tell us a little bit about yourself. What do you do for hobbies and things like that.`];
            let emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            let index = 0;

            let jobs = ``;
            for(let i = 0; i < devJobs.length; i++) jobs += `${emojis[i]} - ${devJobs[i]}\n`;

            qEmbed.setDescription(`${questions[0]}\n\n\`\`\`${jobs}\`\`\``);
            let devMsg = await chan.send(qEmbed);
            for(let i = 0; i < devJobs.length; i++) devMsg.react(emojis[i]);

            let eCollector = devMsg.createReactionCollector((reaction, u) => emojis.includes(reaction.emoji.name) && u.id === user.id);
            eCollector.on('collect', async(reaction, user) => {
                let job = devJobs[emojis.indexOf(reaction.emoji.name)];
                devMsg.delete();

                qEmbed.setDescription(questions[++index]);
                let a = await chan.send(qEmbed);

                let collector = chan.createMessageCollector(m => m.author.id === user.id);
                collector.on('collect', async m => {
                    m.delete(); a.delete();
                    if(index + 1 === questions.length) return collector.stop();

                    qEmbed.setDescription(questions[++index]);
                    a = await chan.send(qEmbed);
                });
                
                collector.on('end', async collected => {
                    let arrayX = collected.array();
                    let role = message.guild.roles.cache.find(x => x.name === `💻 ${job}`);

                    let collectedEmbed = new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setTitle("Application")
                    .addField("**Role**", role)
                    .addField("**Age**", arrayX[0].content)
                    .addField("**Timezone**", arrayX[1].content)
                    .addField("**Portfolio**", arrayX[2].content)
                    .addField("**Why do you want to work for quest development?**", arrayX[3].content)
                    .addField("**How did you find quest development?**", arrayX[4].content)
                    .addField("**How active can you be?**", arrayX[5].content)
                    .addField("**List of teams they worked for in past.**", arrayX[6].content)
                    .addField("**List of teams they currently work in.**", arrayX[7].content)
                    .addField("**Self description**", arrayX[8].content)
                    .setFoooter(user.id);
                    let applicationEmbed = await chan.send(collectedEmbed); applicationEmbed.react("✅"); applicationEmbed.react("🚫");
                    chan.send("<@&"+ client.config.manager_role +">").then(u => u.delete({timeout: 1000}));
                });
            });
        }
    }

    if(message.channel.id === client.config.commissionChannel) {
        reaction.users.remove(user);

        if(reaction.emoji.name === "💰") {
            let qEmbed = new Discord.MessageEmbed()
            .setColor(client.config.color)
            .setTitle(`Answer the following question.`)
            .setFooter(`You have 16 minutes to answer the question.`);

            /* First question */
            qEmbed.setDescription(`How many hours would this job take you to complete?`)
            let a = await user.send(qEmbed);

            /* First collector */
            let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, {max: 1});
            collector.on('collect', async m => {
                let hours = m.content;
                a.delete();

                /* Second question */
                qEmbed.setDescription(`Please provide your portfolio link.`)
                let b = await user.send(qEmbed);

                /* Second collector */
                let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, {max: 1});
                collector.on('collect', async m => {
                    let portfolio = m.content;
                    b.delete();

                    let days = parseInt(hours) / client.config.hoursADay; 
                    let deadline = new Date();
                    deadline.setDate(deadline.getDate() + days);

                    let price = parseInt(parseInt(hours) * client.config.pricePerHour * client.config.fee);
                    if(doc.type === "💻 Configurator") price = parseInt(parseInt(hours) * client.config.configuratorPrice * client.config.fee);

                    let channel = message.guild.channels.cache.get(message.embeds[0].footer.text);
                    let quote = new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setTitle(`New Quote`)
                    .setDescription(`Quote from developer ${user}.`)
                    .setThumbnail(user.displayAvatarURL())
                    .addField(`Price`, price, true)
                    .addField(`Deadline`, moment(deadline).format(`MMMM Do`), true)
                    .addField(`Portfolio`, portfolio, true)
                    .setFooter(user.id);
                    let quoteMSG = await channel.send(quote);
                    quoteMSG.react("✅"); quoteMSG.react("🚫");
                });
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
            .addField(`Login Time`, moment(Date.now()).format('LT'))
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
            .addField(`Login Time`, moment(doc.login).format('LT'), true)
            .addField(`Logout Time`, moment(Date.now()).format('LT'), true)
            .addField(`Session Time`, ms(Date.now() - doc.login), true)
            .setColor(client.config.color)

            let userSend = new Discord.MessageEmbed()
            .setTitle(`You have signed-out of working.`)
            .addField(`Login Time`, moment(doc.login).format('LT'), true)
            .addField(`Logout Time`, moment(Date.now()).format('LT'), true)
            .addField(`Session Time`, ms(Date.now() - doc.login), true)
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

    if(message.channel.parent && message.channel.parent.id === client.config.order_parent) {
        reaction.users.remove(user);

        if(reaction.emoji.name === "🚫") {
            message.delete();

            let doc = await client.models.ticket.findOne({ ticket: message.channel.id }).exec();

            let member = message.guild.members.cache.get(message.embeds[0].footer.text);
            let embed = new Discord.MessageEmbed()
            .setColor(client.config.color)
            .setTitle(`Quote Declined`)
            .setDescription(`Quote declined for ticket below.`)
            .addField(`Ticket Name`, message.channel.name, true)
            .addField(`Ticket Details`, doc.details, true)
            .addField(`Ticket Owner`, user.tag, true)
            member.send(embed);
        } else if(reaction.emoji.name === "✅") {
            message.delete();

            let doc = await client.models.ticket.findOne({ ticket: message.channel.id }).exec();
            let member = message.guild.members.cache.get(message.embeds[0].footer.text);
            let price = parseInt(message.embeds[0].fields[0].value);

            let comChan = message.guild.channels.cache.get(client.config.commissionChannel);
            let msg = await comChan.messages.fetch(doc.commission); msg.delete();

            doc.price = price;
            doc.save();

            message.channel.createOverwrite(member, { VIEW_CHANNEL: true, READ_MESSAGE_HISTORY: true, SEND_MESSAGES: true });

            let embed = new Discord.MessageEmbed()
            .setColor(client.config.color)
            .setTitle(`Quote Accepted`)
            .setDescription(`Quote accepted for ticket below.`)
            .addField(`Ticket Name`, message.channel.name, true)
            .addField(`Ticket Details`, doc.details, true)
            .addField(`Ticket Owner`, user.tag, true)
            member.send(embed);

            let ticketEmbed = new Discord.MessageEmbed()
            .setColor(client.config.color)
            .setTitle(`Developer Accepted`)
            .setDescription(`Developer ${member} has been added to the order.`)
            message.channel.send(ticketEmbed);

            let invoiceJSON = {
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
            
            paypal.invoice.create(invoiceJSON, async(err, invoice) => {
                if(err) return await console.log(JSON.stringify(err));
        
                paypal.invoice.send(invoice.id, async(err, rv) => {
                    if (err) return await console.log(JSON.stringify(err));
        
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
    }
}

