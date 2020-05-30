const Discord = require("discord.js");

module.exports = async(client, reaction, user) => {
    if(user.bot) return;
    if(reaction.message.partial) await reaction.message.fetch();

    let message = reaction.message;

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

                chan.createOverwrite(arrayX[0].mentions.members.first(), { SEND_MESSAGES: true, VIEW_CHANNEL: true });
                chan.send("<@&"+ client.config.manager_role +">")
            });
        }
    }
}

/*
new client.models.timesheet({
    user: message.author.id,
    login: Date.now(),
    logout: Date.now(),
    totalTime: Date.now()
}).save();
*/

/* 
      paypal.configure({
          "mode": "live",
          "client_id": "AT0Vv2YmpROshJVqqvjI94gqRCS6aLuZXs2Lja4S_yOUVIln5HnppL1R9O_C6yKjiee8eF1z-V_msF0J",
          "client_secret": "EKOzJP-WDkWGKNoCFaRrm8pB_aVJKgJ8OMyUPRNEBnNkBSdL4eyxGMlKvSkvCfbrZF-H6iT1jCZwpXUP"
      });

      if (reaction.emoji.name === '🏦') {
          if (messageComm.embeds[0].footer.text === "Invoice") {
              const invoice = messageComm.embeds[0].fields[0].value;

              paypal.invoice.get(invoice, async function (error, invoice) {
                  if (error) {
                      messageComm.channel.send(new Discord.RichEmbed().setTitle("Invoice Not Paid!").setDescription("This invoice has not been paid, please pay it and react to the message again.").setColor("RED"))
                      reaction.remove(userComm)
                      throw error;
                      return;
                  } else {
                      if (invoice.status === "PAID") {
                          const embed = new Discord.RichEmbed()
                              .setTitle("Payment Verified!")
                              .setDescription("Congratulations the invoice has been paid!")
                              .setColor(3066993)
                          messageComm.edit(embed)
                          messageComm.clearReactions()
                          let chanTopic = channelComm.topic;
                          let userID = chanTopic.slice(-18);
                          let userObj = client.fetchUser(userID);
                          // userObj.addRole(client.config.paid_role);
                          return clearInterval(invoicecheck);
                          //successful-commissons
                      } else {
                        if (invoice.status == "SENT") {
                           const embed = new Discord.RichEmbed()
                           embed.setColor("#8B0000")
                           embed.setDescription("This invoice is unpaid please click the 🏦 once paid")
                           messageComm.channel.send(embed).then(m => m.delete(8000));
                        }
                    }
                  }
              });
           }
      }
*/