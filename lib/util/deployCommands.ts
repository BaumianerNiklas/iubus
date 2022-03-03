import { Command } from "../structures/Command.js";
import { resolveModules } from "./resolveModules.js";
import { REST } from "@discordjs/rest";
import { GLOBAL_DEPLOY_URL, GUILD_DEPLOY_URL } from "./constants.js";

export async function deployCommands(options: DeployOptions) {
	const commands = (await resolveModules(options.commandDir, (mod) => mod instanceof Command)) as Command[];
	const rest = new REST({ version: "9" }).setToken(options.token);

	const route = options.deployGlobally
		? GLOBAL_DEPLOY_URL(options.applicationId)
		: GUILD_DEPLOY_URL(options.applicationId, options.guildId!);

	rest.put(route, {
		body: commands.map((c) => {
			return {
				name: c.name,
				type: c.type,
				description: c.description,
				options: c.options,
			};
		}),
	});
}

export interface DeployOptions {
	commandDir: string;
	applicationId: string;
	token: string;
	deployGlobally?: boolean;
	guildId?: string;
}

export interface GlobalDeployOptions extends DeployOptions {
	deployGlobally?: false;
	guildId: string;
}

export interface LocalDeployOptions extends DeployOptions {
	deployGlobally: true;
	guildId: never;
}
