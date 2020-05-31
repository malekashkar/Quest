module.exports = async(client, member) => {
    let autoRole = member.guild.roles.cache.get(client.config.unverified);
    member.roles.add(autoRole);
}