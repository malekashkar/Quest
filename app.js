const Discord = require("discord.js");
const mongoose = require("mongoose");
const client = new Discord.Client();
const Enmap = require('enmap');
const fs = require('fs');

client.config = require("./config");
client.commands = new Enmap();
client.models = {
    timesheet: require("./database/models/timesheet")
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
