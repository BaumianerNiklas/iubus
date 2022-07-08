# Iubus

<div align="center">

![Iubus Banner](assets/banner.svg)

</div>

Dead simple discord.js v14 slash command framework. Iubus (from the latin word _iubere_ - "to command, to order") is a simple, barebones framework on top of discord.js for easily dealing with slash commands.

NOTE: This is not released as a npm package yet. The project is still somewhat under development, though I'm hoping to publish it along with when discord.js v14 becomes a stable release. There are currently no plans of changing the interface etc. of the library anymore, and it should already be ready enough to be released.

The documentation/guide for the frameowork is contained in the [GitHub Wiki](https://github.com/BaumianerNiklas/iubus/wiki), but here's a quickstart example:

In your entry file:

```ts
import { IubusClient } from "iubus";

const client = new IubusClient({
	intents: /* ... */,
	dirs: {
		commands: "./dist/commands",
		events: "./dist/events",
	},
	deploy: {
		token: "YOUR_TOKEN",
		applicationId: "YOUR_APPLICATION_ID",
		guildId: "YOUR_GUILD_ID", // will be ignored if deployGlobally is set to true
		deployGlobally: true, // defaults to false
		deployOnChange: true, // re-deploy commands whenever Iubus detects a change in the command data
	}
});

client.login("YOUR_TOKEN");
```

Then, in a command file (inside `commandDir`):

```ts
import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { ChatInputCommand } from "iubus";

export default new ChatInputCommand({
	name: "echo",
	description: "Echo back your text",
	options: {
		type: ApplicationCommandOptionType.String,
		name: "text",
		description: "The text to echo back",
		required: true,
	},
	run(interaction: ChatInputCommandInteraction) {
		const text = interaction.getString("text", true);
		interaction.reply({ content: text });
	},
});
```

---

This library is mostly a passion project I created for myself, but at the same time I do hope others will find the use in this once it is released as a npm package. This is also my first time making a npm package, so any constructive feedback, criticism, or contribution in form of a issue or pull request would be greatly appreciated :)
