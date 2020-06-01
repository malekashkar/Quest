module.exports = async(client, member) => {
    let role = member.guild.roles.cache.get(client.config.unverified);
    member.roles.add(role);
}