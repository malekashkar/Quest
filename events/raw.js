client.on('raw', async event => {
  
    if (!events.hasOwnProperty(event.t)) return;
  
    const { d: data } = event
  
    const user = client.users.get(data.user_id);
    const channel = client.channels.get(data.channel_id);
    if (!channel) return;
    const message = await channel.fetchMessage(data.message_id);
    const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
    const reaction = message.reactions.get(emojiKey);
    const channelComm = client.channels.get(data.channel_id);
    const messageComm = await channelComm.fetchMessage(data.message_id);
    const userComm = client.users.get(data.user_id);

      if (user.bot) return;

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
                          // userObj.addRole(config.paid_role);
                          return clearInterval(invoicecheck);
                          //successful-commissons
                      }else{
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

    if (reaction.message.id === config.ticket_id) {
  
      reaction.remove(user);
  
      if (reaction.emoji.name === '📝') {
  
        var seq = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
        var name = "📝-order-" + seq;
      
        reaction.message.guild.createChannel(name, { type: "text" }).then((chan) => {
  
          chan.setTopic(`${userComm.id}`);

          chan.overwritePermissions(message.guild.roles.find(role => role.name === "@everyone"), {
            SEND_MESSAGES: false,
            READ_MESSAGES: false
          })

          chan.overwritePermissions(message.guild.roles.find(role => role.name === "✔️ Verified"), {
            SEND_MESSAGES: false,
            READ_MESSAGES: false
          })
    
          chan.overwritePermissions(user, {
            SEND_MESSAGES: true,
            READ_MESSAGES: true
          }).then((newchannel) => {
            newchannel.setParent(config.order_parent);
          })
  
          var users = [];

          message.guild.roles.get('652633724709765155').members.forEach(m => users.push(m.id));
          var showUserTags = message.guild.roles.get('652633724709765155').members.map(m => m.user.tag).join('\n');

          let q1 = "**Please @ the 📈 Sales Representative that got you to join Quest**" 
          + "\n\n" + " List of Sales Representative : ```" + showUserTags + "```"
          let q2 = "**What role are you requesting**"
          +"\n"+
          "```[ Developers ] \n 💻 Java Developer \n 💻 Expedited Developer \n 💻 Web Developer \n 💻 Bot Developer \n 💻 Jar Developer \n 💻 Forge Developer \n 💻 Sys Admin \n 💻 Configurator```";
          let q3 = "Tell us a bit about that you're requesting:";
          let q4 = "What is your budget:";
          let q5 = "What is your deadline:";
          let q6 = "Have you missed out any details we may need to know?";
          let q7 = "Do you have any examples?" +
            "\n\n Please use one of these links to post your examples on then send the link"
            + "\n" + "```https://imgur.com/```";
  
            let embedd = new Discord.RichEmbed()
            embedd.setColor("#00BBE8")
            embedd.setTitle(`Please answer this question \n(You have 16 Minutes to complete each question):`);
            embedd.setDescription(q1)
            setTimeout(function(){ 
              chan.send(embedd)
            }, 3000);

            let collector = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
            collector.on(`collect`, message => {
                var member = message.mentions.members.first();
                if (!member) return message.reply(`Please mention a user listed above.`);
                if (!users.includes(member.id)) return message.reply(`Please mention a user listed above.`);
              chan.fetchMessages({
                limit: 2,
              }).then((messages) => {
                chan.bulkDelete(messages).catch(error => log.error(error.stack));
              }).catch((error) => { log.error(error) });
              let answer1 = message.content;
              embedd.setDescription(q2)
              chan.send(embedd)
              collector.stop();

              let collector1 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
              collector1.on(`collect`, message => {
                chan.fetchMessages({
                  limit: 2,
                }).then((messages) => {
                  chan.bulkDelete(messages).catch(error => log.error(error.stack));
                }).catch((error) => { log.error(error) });
                let answer2 = message.content;
                embedd.setDescription(q3)
                chan.send(embedd)
                collector1.stop();

                let collector2 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
                collector2.on(`collect`, message => {
                  chan.fetchMessages({
                    limit: 2,
                  }).then((messages) => {
                    chan.bulkDelete(messages).catch(error => log.error(error.stack));
                  }).catch((error) => { log.error(error) });
                  let answer3 = message.content;
                  embedd.setDescription(q4)
                  chan.send(embedd)
                  collector2.stop();

                  let collector3 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
                  collector3.on(`collect`, message => {
                    chan.fetchMessages({
                      limit: 2,
                    }).then((messages) => {
                      chan.bulkDelete(messages).catch(error => log.error(error.stack));
                    }).catch((error) => { log.error(error) });
                    let answer4 = message.content;
                    embedd.setDescription(q5)
                    chan.send(embedd)
                    collector3.stop();

                    let collector4 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
                    collector4.on(`collect`, message => {
                      chan.fetchMessages({
                        limit: 2,
                      }).then((messages) => {
                        chan.bulkDelete(messages).catch(error => log.error(error.stack));
                      }).catch((error) => { log.error(error) });
                      let answer5 = message.content;
                      embedd.setDescription(q6)
                      chan.send(embedd)
                      collector4.stop();

                      let collector5 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
                      collector5.on(`collect`, message => {
                        chan.fetchMessages({
                          limit: 2,
                        }).then((messages) => {
                          chan.bulkDelete(messages).catch(error => log.error(error.stack));
                        }).catch((error) => { log.error(error) });
                        let answer6 = message.content;
                        embedd.setDescription(q7)
                        embedd.setImage("https://i.imgur.com/J86npaf.gifv")
                        chan.send(embedd)
                        collector5.stop();

                      let collector6 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
                      collector6.on(`collect`, message => {
                        chan.fetchMessages({
                          limit: 2,
                        }).then((messages) => {
                          chan.bulkDelete(messages).catch(error => log.error(error.stack));
                        }).catch((error) => { log.error(error) });
                        let answer7 = message.content;
                        collector6.stop();

                        message.channel.overwritePermissions(member, { SEND_MESSAGES: true, VIEW_CHANNEL: true });
                        message.channel.send("<@&"+ config.manager_role +">")

                        let ad = new Discord.RichEmbed()
                          ad.setColor("#ff3153");
                          ad.setTitle("Melody Bot")
                          ad.setDescription("Melody is a Discord bot which allows you & your friends to listen to your favourite music on the fly. Melody supports various music platforms," 
                          + "including Spotify, Soundcloud, YouTube, and Twitch! Melody brings music on demand to your server."
                          + "\n\n" + 
                          "**Website**: https://melody-bot.xyz/"
                          + "\n" + 
                          "**Discord**: https://discord.melody-bot.xyz/")
                          ad.setFooter("Ad from Melody")
                          ad.setThumbnail("https://cdn.discordapp.com/attachments/285474722098053141/712512703033245797/Melody-Icon-Detailed.png")
                          ad.setTimestamp();

                        let embed2 = new Discord.RichEmbed()
                          .setColor("#00BBE8")
                          .setTitle(`New commissions!`)
                          .addField("**Channel Name**", message.guild.channels.find(channel => channel.id === chan.id))
                          .addField("**Sales Representative**", member.user)
                          .addField("**What role are you requesting**", answer2)
                          .addField("Detail:", answer3)
                          .addField("Budget:", answer4)
                          .addField("Deadline:", answer5)
                          .addField("More info:", answer6)
                          .addField("Example:", answer7)
                          .setFooter(chan.id);

                          message.channel.send(embed2).then(m => m.pin());
                          message.channel.send(ad).then(m => m.pin());
                        })
                    })
                })
                })
            })
            })
        })
        })
    }

      if (reaction.emoji.name === '📜') {
  
        var seq = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
        var name = "📜-application-" + seq;
      
        reaction.message.guild.createChannel(name, { type: "text" }).then((chan) => {
  
          chan.overwritePermissions(message.guild.roles.find(role => role.name === "@everyone"), {
            SEND_MESSAGES: false,
            READ_MESSAGES: false
          })
  
          chan.overwritePermissions(message.guild.roles.find(role => role.name === "✔️ Verified"), {
            SEND_MESSAGES: false,
            READ_MESSAGES: false
          })

          chan.overwritePermissions(user, {
            SEND_MESSAGES: true,
            READ_MESSAGES: true
          }).then((newchannel) => {
            newchannel.setParent(config.application_parent);
          })
  
          let q1 = "Why do you want to work for us?";
          let q2 = "How did you find out about this team?";
          let q3 = "How old are you?";
          let q4 = "What time zone are you in!";
          let q5 = "How active can you be?";
          let q6 = "**What role are you applying for!**"
          + "\n\n" +
          "Here is a list of roles we offer:"
          +"\n"+
          "```[ Developers ] \n 💻 Java Developer \n 💻 Expedited Developer \n 💻 Web Developer \n 💻 Bot Developer \n 💻 Jar Developer \n 💻 Forge Developer \n 💻 Sys Admin \n 💻 Configurator \n\n[ General Employees ] \n 💼 Manager \n 📈 Sales Representative```";
          let q7 = "Please give us a portfolio of the roles you are applying for!" +
            "\n\n If you dont have a website please use the website below to upload your portfolio on."
            + "\n" + "```https://imgur.com/```";
          let q8 = "Please list teams you have worked for in the past!";
          let q9 = "Whats teams are you working for now?";
          let q10 = "Please tell us a bit about yourself. Like what you do for Hobbies and things like that!";
  
          let embedd = new Discord.RichEmbed().setColor("#00BBE8").setTitle(`Please answer this question \n(You have 16 Minutes to complete each question):`);
    
          embedd.setDescription(q1)
          setTimeout(function(){ 
            chan.send(embedd)
          }, 3000);
  
          let collector = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
          collector.on(`collect`, message => {
            chan.fetchMessages({
              limit: 2,
            }).then((messages) => {
              chan.bulkDelete(messages).catch(error => log.error(error.stack));
            }).catch((error) => { log.error(error) });
            let answer1 = message.content;
            embedd.setDescription(q2)
            chan.send(embedd)
            collector.stop();
  
            let collector1 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
            collector1.on(`collect`, message => {
              chan.fetchMessages({
                limit: 2,
              }).then((messages) => {
                chan.bulkDelete(messages).catch(error => log.error(error.stack));
              }).catch((error) => { log.error(error) });
              let answer2 = message.content;
              embedd.setDescription(q3)
              chan.send(embedd)
              collector1.stop();
  
              let collector2 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
              collector2.on(`collect`, message => {
                chan.fetchMessages({
                  limit: 2,
                }).then((messages) => {
                  chan.bulkDelete(messages).catch(error => log.error(error.stack));
                }).catch((error) => { log.error(error) });
                let answer3 = message.content;
                embedd.setDescription(q4)
                chan.send(embedd)
                collector2.stop();
  
                let collector3 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
                collector3.on(`collect`, message => {
                  chan.fetchMessages({
                    limit: 2,
                  }).then((messages) => {
                    chan.bulkDelete(messages).catch(error => log.error(error.stack));
                  }).catch((error) => { log.error(error) });
                  let answer4 = message.content;
                  embedd.setDescription(q5)
                  chan.send(embedd)
                  collector3.stop();
  
                  let collector4 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
                  collector4.on(`collect`, message => {
                    chan.fetchMessages({
                      limit: 2,
                    }).then((messages) => {
                      chan.bulkDelete(messages).catch(error => log.error(error.stack));
                    }).catch((error) => { log.error(error) });
                    let answer5 = message.content;
                    embedd.setDescription(q6)
                    chan.send(embedd)
                    collector4.stop();
  
                    let collector5 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
                    collector5.on(`collect`, message => {
                      chan.fetchMessages({
                        limit: 2,
                      }).then((messages) => {
                        chan.bulkDelete(messages).catch(error => log.error(error.stack));
                      }).catch((error) => { log.error(error) });
                      let answer6 = message.content;
                      embedd.setDescription(q7)
                      chan.send(embedd)
                      collector5.stop();
  
                      let collector6 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
                      collector6.on(`collect`, message => {
                        chan.fetchMessages({
                          limit: 2,
                        }).then((messages) => {
                          chan.bulkDelete(messages).catch(error => log.error(error.stack));
                        }).catch((error) => { log.error(error) });
                        let answer7 = message.content;
                        embedd.setDescription(q8)
                        chan.send(embedd)
                        collector6.stop();
  
                        let collector7 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
                        collector7.on(`collect`, message => {
                          chan.fetchMessages({
                            limit: 2,
                          }).then((messages) => {
                            chan.bulkDelete(messages).catch(error => log.error(error.stack));
                          }).catch((error) => { log.error(error) });
                          let answer8 = message.content;
                          embedd.setDescription(q9)
                          chan.send(embedd)
                          collector7.stop();
  
                          let collector8 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
                          collector8.on(`collect`, message => {
                            chan.fetchMessages({
                              limit: 2,
                            }).then((messages) => {
                              chan.bulkDelete(messages).catch(error => log.error(error.stack));
                            }).catch((error) => { log.error(error) });
                            let answer9 = message.content;
                            embedd.setDescription(q10)
                            chan.send(embedd)
                            collector8.stop();

                          let collector9 = new Discord.MessageCollector(chan, m => m.author.id === user.id, { time: 960000 });
                          collector9.on(`collect`, message => {
                            chan.fetchMessages({
                              limit: 2,
                            }).then((messages) => {
                              chan.bulkDelete(messages).catch(error => log.error(error.stack));
                            }).catch((error) => { log.error(error) });
                            let answer10 = message.content;
                            collector9.stop();
  
                            
                            message.channel.send("<@&"+ config.manager_role +">")
                            let embed = new Discord.RichEmbed()
                              .setColor("#00BBE8")
                              .setTitle(`New application!`)
                              .addField("**Channel Name**", message.guild.channels.find(channel => channel.id === chan.id))
                              .addField(q1, answer1)
                              .addField(q2, answer2)
                              .addField(q3, answer3)
                              .addField(q4, answer4)
                              .addField(q5, answer5)
                              .addField("What Roles are you applying for!", answer6)
                              .addField("Please give us a portfolio of the roles you are applying for!", answer7)
                              .addField(q8, answer8)
                              .addField(q9, answer9)
                              .addField(q10, answer10)
                              .setFooter(chan.id);

                              let ad = new Discord.RichEmbed()
                              ad.setColor("#ff3153");
                              ad.setTitle("Melody Bot")
                              ad.setDescription("Melody is a Discord bot which allows you & your friends to listen to your favourite music on the fly. Melody supports various music platforms," 
                              + "including Spotify, Soundcloud, YouTube, and Twitch! Melody brings music on demand to your server."
                              + "\n\n" +
                              "**Website**: https://melody-bot.xyz/"
                              + "\n" + 
                              "**Discord**: https://discord.melody-bot.xyz/")
                              ad.setFooter("Ad from Melody")
                              ad.setThumbnail("https://cdn.discordapp.com/attachments/285474722098053141/712512703033245797/Melody-Icon-Detailed.png")
                              ad.setTimestamp();

                              message.channel.send(embed).then(m => m.pin());
                              message.channel.send(ad).then(m => m.pin());

                            })
                         })
                        })
                     })
                    })
                 })
                })
              })
            })
          })
        })
      }

      if (reaction.emoji.name === '💡') {
  
        var seq = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
        var name = "💡-support-" + seq;
      
        reaction.message.guild.createChannel(name, { type: "text" }).then((chan) => {
  
          chan.overwritePermissions(message.guild.roles.find(role => role.name === "@everyone"), {
            SEND_MESSAGES: false,
            READ_MESSAGES: false
          })
  
          chan.overwritePermissions(message.guild.roles.find(role => role.name === "✔️ Verified"), {
            SEND_MESSAGES: false,
            READ_MESSAGES: false
          })

          chan.overwritePermissions(user, {
            SEND_MESSAGES: true,
            READ_MESSAGES: true
          }).then((newchannel) => {
            newchannel.setParent(config.application_parent);
          })
  
          let embedd = new Discord.RichEmbed()
          embedd.setColor("#00BBE8")
          embedd.setDescription("Please React with 💸 if you requre a refund \n\n Please React with 💡 for other")
          

          chan.send(embedd).then(async m => {
            m.react("💸").then(() => m.react("💡")).then(() => {

                const filter = (reaction, user) => {
                    return ['💸', '💡'].includes(reaction.emoji.name);
                  };
                  const collector = m.createReactionCollector(filter);
                  collector.on('collect', (reaction, reactionCollector) => {
      
                    if (reaction.users.last().id === "701831119116697670") {
                        return
                    }

                    const support = m.channel;
                    const refund = m.channel;

                    if (reaction.emoji.name === '💸') {
                        m.delete();
                        m.channel.send("<@&"+ config.manager_role +">")
                        let embedd = new Discord.RichEmbed()
                        embedd.setColor("#00BBE8")
                        embedd.setDescription("One of our <@&"+ config.manager_role +">'s will be with you soon to resolve this problem!")
                        refund.setParent(config.refund_id);
                        setTimeout(function(){ 
                          m.channel.send(embedd);
                        }, 3000);
                    }

                    if (reaction.emoji.name === '💡') {
                        m.delete();
                        let embedd = new Discord.RichEmbed()
                        m.channel.send("<@&"+ config.manager_role +">")
                        embedd.setColor("#00BBE8")
                        embedd.setDescription("One of our <@&"+ config.manager_role +">'s will be with you soon to resolve this problem!")
                        support.setParent(config.support_id);
                        setTimeout(function(){ 
                          m.channel.send(embedd);
                        }, 3000);
                    }      
              })
            })
          })
        })
      }

    }
})