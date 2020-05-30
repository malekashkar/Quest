new client.models.timesheet({
    user: message.author.id,
    login: Date.now(),
    logout: Date.now(),
    totalTime: Date.now()
}).save();