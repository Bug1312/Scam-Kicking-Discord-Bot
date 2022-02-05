/*
 * ======================================================================================== *
 * Key      | Datatype | Description                                                        *
 * ---------|----------|------------------------------------------------------------------- *
 * listPath | String   | Filepath to list of scam domains, separated by a newline character *
 * botToken | String   | Discord Bot token                                                  *
 * adminID  | String   | Discord ID for role allowed to add domains                         *
 * serverID | String   | Discord ID for server command is allowed in                        *
 * ======================================================================================== *
 */

const conf = {
	listPath: (__dirname + '/list'),
	botToken: "",
	adminID : "",
	serverID: ""
}

const
	{ Client, Intents } = require('discord.js'),
	{ SlashCommandBuilder } = require('@discordjs/builders'),
	fs = require('fs'),
	bot = new Client({intents: new Intents([Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS])}),
	list = fs.readFileSync(conf.listPath).toString().replace(/\n\s+/gm, '\n').split('\n');

/* Log the bot in */
bot.login(conf.botToken);

/* Setup command */
bot.on('ready', () => {
	bot.guilds.cache.get(conf.serverID).commands.create(
		new SlashCommandBuilder()
		.setName('scam')
		.setDescription('Adds scam link to list')
		.addStringOption(option =>
			option.setName('link')
			.setDescription('Base domain of scam URL')
			.setRequired(true))
	)
})

/* React to command */
bot.on('interactionCreate', (interaction) => {
	// Not all interactions are commands!
	if (!interaction.isCommand()) return

	// If command is /scam as well as if user hase adminID role
	if (interaction.commandName === 'scam') {
		if(interaction.guild.members.cache.get(interaction.user.id).roles.cache.get(conf.adminID)) {
			let newLink = interaction.options.getString('link');

			// Gets base domain if user adds in extra values
			newLink = newLink.replace(/(^https*:\/\/(www\.)?|\/.*$|^www\.|\n|\r)/g, '');
			// Appends newLink to file at listPath
			fs.appendFile(conf.listPath, '\n' + newLink, (err) => { console.log(err) });
			// Confirms file was appeneded
			interaction.reply('Added domain');
		}
	}
})

/* Kick & removal of scam */
bot.on('messageCreate', (msg) => {
	// If there is a match of the message and an entree in list, kick the user & delete the message
	if (list.some(scam => { return new RegExp('https*:\/\/[\\S]*' + scam + '\/').test(msg.content) })) {
		// If possible, kick user
		if (msg.guild.members.cache.get(msg.author.id).kickable) msg.guild.members.cache.get(msg.author.id).kick('Scam URL');
		msg.delete();
	}
});
