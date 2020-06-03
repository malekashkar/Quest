const Discord = require("discord.js");
const paypal = require("paypal-rest-sdk");
const moment = require("moment");
const ms = require("ms");

module.exports = async(client, reaction, user) => {
    if(user.bot) return;
    if(reaction.message.partial) await reaction.message.fetch();

    let message = reaction.message;
    await user.createDM();

    paypal.configure({ "mode": "live", "client_id": client.config.paypal_client_id, "client_secret": client.config.paypal_client_secret});
    
    //////////////////////
    /* Check an invoice */
    //////////////////////

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

                let doc = await client.models.ticket.findOne({ ticket: message.channel.id }).exec();
                if(doc.price === 0) return;

                if (invoice.status === "PAID") {
                    let completeEmbed = new Discord.MessageEmbed()
                    .setTitle("Payment Verified.")
                    .setDescription("Congratulations, the invoice has been paid!")
                    .setColor(client.config.color)
                    message.edit(completeEmbed);
                    message.reactions.removeAll();

                    let percent = doc.price / Number(invoice.total_amount.value);

                    if(percent === 2) {
                        price = price / 2;
                        doc.paid = price;
                        doc.percent = 50;
                        doc.save();
                    } else if(percent === 1) {
                        doc.paid = price;
                        doc.percent = 100;
                        doc.save();
                    }
                } else {
                    let unpaidEmbed = new Discord.MessageEmbed()
                    .setTitle("Invoice Unpaid.")
                    .setDescription("The invoice is still unpaid, please complete the payment.")
                    .setColor("RED")
                    message.channel.send(unpaidEmbed).then(m => m.delete({timeout: 8000}));
                }
            });
         }
    }

    /////////////////////
    /* Create an order */
    /////////////////////
    
    if (message.id === client.config.ticket_id) {
        reaction.users.remove(user);
        if (reaction.emoji.name === '📝') {
            let seq = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
            let chan = await message.guild.channels.create(`📝-order-${seq}`);

            chan.createOverwrite(message.guild.id, { VIEW_CHANNEL: false });
            chan.createOverwrite(user, { VIEW_CHANNEL: true, SEND_MESSAGES: true });
            chan.setParent(client.config.order_parent);
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
                                let col = await chan.send(collectedEmbed); col.pin();
                                chan.send(quoteInfo);
                                chan.send("<@&"+ client.config.manager_role +">").then(u => u.delete({timeout: 1000}));

                                new client.models.ticket({
                                    "user": message.author.id,
                                    "ticket": chan.id,
                                    "commission": commID.id,
                                    "details": details,
                                    "price": 0,
                                    "type": devRole.name,
                                    "paid": 0,
                                    "percent": 0,
                                    "developer": "0"
                                }).save();
                            });
                        });
                    });
                });
            });
        }
    }

    ///////////////////////////
    /* Create an application */
    ///////////////////////////

    if (message.id === client.config.ticket_id) {
        if(reaction.emoji.name === "📜") {
            reaction.users.remove(user);

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
                    .setFooter(user.id);
                    let applicationEmbed = await chan.send(collectedEmbed); applicationEmbed.react("✅"); applicationEmbed.react("🚫");
                    chan.send("<@&"+ client.config.manager_role +">").then(u => u.delete({timeout: 1000}));
                });
            });
        }
    };

    /////////////////////
    /* Support Tickets */
    /////////////////////

    if (message.id === client.config.ticket_id) {
        if(reaction.emoji.name === "💡") {
            reaction.users.remove(user);

            let seq = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
            let chan = await message.guild.channels.create(`💡-support-${seq}`);

            chan.setParent(client.config.support_parent);
            chan.createOverwrite(message.guild.id, { VIEW_CHANNEL: false });
            chan.createOverwrite(user, { VIEW_CHANNEL: true, SEND_MESSAGES: true });
            chan.send(`${user}`).then(m => m.delete({timeout: 1000}));
            chan.setTopic(user.id);

            /* Ask the questions below */
            let qEmbed = new Discord.MessageEmbed()
            .setColor(client.config.color)
            .setTitle(`Answer the following question.`)
            .setFooter(`You have 16 minutes to answer the question.`);

            qEmbed.setDescription(`What is your reason for contacting support?`);
            let a = await chan.send(qEmbed);

            const collector = chan.createMessageCollector(m => m.author.id === user.id, { max: 1 });
            collector.on('collect', async m => {
                let reason = m.content;
                a.delete(); m.delete();

                qEmbed.setDescription(`Is this in regard of a project you've order from us?`);
                let e = await chan.send(qEmbed); e.react("✅"); e.react("🚫");

                const eCollector = e.createReactionCollector((reaction, u) => ["✅", "🚫"].includes(reaction.emoji.name) && u.id === user.id, { max: 1 });
                eCollector.on('collect', async(reaction, user) => {
                    e.delete();
                    if(reaction.emoji.name === "✅") {
                        qEmbed.setDescription(`What is the name of the developer that completed your project?`);
                        a = await chan.send(qEmbed);

                        const collector = chan.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                        collector.on('collect', async m => {
                            let devName = m.content;
                            a.delete(); m.delete();

                            let yesComplete = new Discord.MessageEmbed()
                            .setColor(client.config.color)
                            .setTitle(`Contacting Support..`)
                            .setDescription(`Thanks for contacting our support department. A manager will be with you shortly!`)
                            .setThumbnail(`https://www.questdevelopment.net/assets/images/icon.png`)
                            .addField(`Issue`, reason, true)
                            .addField(`Past Order`, `Yes`, true)
                            .addField(`Developer`, devName, true)
                            chan.send(yesComplete);
                            chan.send("<@&"+ client.config.manager_role +">").then(u => u.delete({timeout: 1000}));
                        });
                    } else {
                        let noComplete = new Discord.MessageEmbed()
                        .setColor(client.config.color)
                        .setTitle(`Contacting Support..`)
                        .setDescription(`Thanks for contacting our support department. A manager will be with you shortly!`)
                        .setThumbnail(`https://www.questdevelopment.net/assets/images/icon.png`)
                        .addField(`Issue`, reason, true)
                        .addField(`Past Order`, `No`, true)
                        chan.send(noComplete);
                        chan.send("<@&"+ client.config.manager_role +">").then(u => u.delete({timeout: 1000}));
                    }
                });
            });
        }
    };

    //////////////////////////////
    /* Accept/Deny Applications */
    //////////////////////////////

    if(message.channel.parent.id === client.config.application_parent) {
        if(!["✅", "🚫"].includes(reaction.emoji.name)) return;
        if(!message.guild.members.cache.get(user.id).roles.cache.some(x => [`🔥 Regional Manager`, `🧭 CMO`, `🏆 CFO`, `👑 COO`, `👑 CEO`, `Admin`].includes(x.name))) return;

        let member = message.guild.members.cache.get(message.embeds[0].footer.text);
        let role = message.guild.roles.cache.get(message.embeds[0].fields[0].value.replace(/<|>|@|&/gi, ""));

        if(reaction.emoji.name === "✅") {
            message.channel.delete();

            let accepted = new Discord.MessageEmbed()
            .setTitle(`You've Been Accepted`)
            .setDescription(`You've been accepted to work with **Quest Development** as a ${role.name}.`)
            .setColor(client.config.color)
            .setThumbnail(`https://www.questdevelopment.net/assets/images/icon.png`)
            .setTimestamp()

            member.roles.add(role);
            member.send(accepted);
        } else if(reaction.emoji.name === "🚫") {
            message.channel.delete();

            let denied = new Discord.MessageEmbed()
            .setTitle(`You've Been Denied`)
            .setDescription(`You've been denied from **Quest Development** to be a ${role.name}`)
            .setColor(client.config.color)
            .setThumbnail(`https://www.questdevelopment.net/assets/images/icon.png`)
            .setTimestamp()

            member.send(denied);
        }
    }

    ////////////////////
    /* Submit A Quote */
    ////////////////////

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

                    let doc = client.models.ticket.findOne({ ticket: message.channel.id });
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

    //////////////////////////
    /* Decline/Accept Quote */
    //////////////////////////

    if(message.channel.parent && message.channel.parent.id === client.config.order_parent) {
        reaction.users.remove(user);

        if(reaction.emoji.name === "🚫") {
            message.delete();

            let doc = await client.models.ticket.findOne({ ticket: message.channel.id }).exec();

            let developer = message.guild.members.cache.get(message.embeds[0].footer.text);
            let embed = new Discord.MessageEmbed()
            .setColor(client.config.color)
            .setTitle(`Quote Declined`)
            .setDescription(`Quote declined for ticket below.`)
            .addField(`Ticket Name`, message.channel.name, true)
            .addField(`Ticket Details`, doc.details, true)
            .addField(`Ticket Owner`, user.tag, true)
            developer.send(embed);
        } else if(reaction.emoji.name === "✅") {
            message.delete();

            let doc = await client.models.ticket.findOne({ ticket: message.channel.id }).exec();
            let developer = message.guild.members.cache.get(message.embeds[0].footer.text);
            let price = parseInt(message.embeds[0].fields[0].value);
            let comChan = message.guild.channels.cache.get(client.config.commissionChannel);
            let msg = await comChan.messages.fetch(doc.commission); msg.delete();

            doc.price = price;
            doc.developer = developer.id;
            doc.save();

            message.channel.createOverwrite(developer, { VIEW_CHANNEL: true, READ_MESSAGE_HISTORY: true, SEND_MESSAGES: true });

            let embed = new Discord.MessageEmbed()
            .setColor(client.config.color)
            .setTitle(`Quote Accepted`)
            .setDescription(`Quote accepted for ticket below.`)
            .addField(`Ticket Name`, message.channel.name, true)
            .addField(`Ticket Details`, doc.details, true)
            .addField(`Ticket Owner`, user.tag, true)
            developer.send(embed);

            let ticketEmbed = new Discord.MessageEmbed()
            .setColor(client.config.color)
            .setTitle(`Developer Accepted`)
            .setDescription(`Would you like to pay 50% of the price, or the full 100%?`)
            .setFooter(`Developer ${developer.username} has been added to the order.`)
            let m = await message.channel.send(ticketEmbed);
            m.react("5️⃣"); m.react("🔟");

            let eCollector = m.createReactionCollector((reaction, u) => u.id === user.id && ["5️⃣", "🔟"].includes(reaction.emoji.name), { max: 1 });
            eCollector.on('collect', async(reaction, user) => {
                m.delete();

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
                            "unit_price": {
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
                };
                
                paypal.invoice.create(invoiceJSON, async(err, invoice) => {
                    if(err) return await console.log(JSON.stringify(err));
            
                    paypal.invoice.send(invoice.id, async(err, r) => {
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
            });
        }
    }

    ////////////////
    /* Front Desk */
    ////////////////

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

    //////////////////
    /* Verification */
    //////////////////

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

