const Discord = require("discord.js");
const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION']});
const Enmap = require('enmap');
const fs = require('fs');
const { doesNotMatch } = require("assert");

require('./database/connect.js');

client.config = require("./config.json");
client.commands = new Enmap();
client.models = {
    timesheet: require("./database/models/timesheet"),
    ticket: require("./database/models/ticket")
}

fs.readdir("./events/", (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
  });
});

fs.readdir("./commands/", (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    if (!file.endsWith(".js")) return;
    let props = require(`./commands/${file}`);
    let commandName = file.split(".")[0];
    client.commands.set(commandName, props);
  });
});

client.login(client.config.token);

let invites;

client.on('ready', async() => {
    invites = await client.guilds.cache.array()[0].fetchInvites();
    invites = invites.array();
});

client.on('guildMemberAdd', async member => {
  let newInvites = await member.guild.fetchInvites();
  newInvites = newInvites.array();

  let user;

  for(let i = 0; i < newInvites.length; i++) {
    if(invites[i].uses < newInvites[i].uses) {
        user = client.users.cache.get(newInvites[i].inviter);
    }
  }

  let doc = client.models.timesheet.findById(user.id);
  if(doc && doc.status) {
    if(doc.type === 'sale' && doc.sessions[doc.sessions.length - 1].work.invites) doc.sessions[doc.sessions.length - 1].work.invites++;
    else if(doc.type === 'sale' && !doc.sessions[doc.sessions.length - 1].work.invites) doc.sessions[doc.sessions.length - 1].work.push({ invites: 1 });
    doc.save();
  }

  invites = newInvites;
});
