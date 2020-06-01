module.exports = async(client, member) => {
    let add = member.guild.roles.cache.get(client.config.unverified);

    member.roles.add(add);
}