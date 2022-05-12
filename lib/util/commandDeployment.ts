import { BaseCommand } from "../structures/Command.js";
import { resolveModules } from "./resolveModules.js";
import { REST } from "@discordjs/rest";
import { GLOBAL_DEPLOY_URL, GUILD_DEPLOY_URL } from "./constants.js";
import {
	type ApplicationCommand,
	Collection,
	type ApplicationCommandData,
	type ApplicationCommandOptionData,
} from "discord.js";
import type { IubusClient } from "../structures/IubusClient.js";
import { deepCompare } from "./deepCompare.js";

// TODO: better name
export async function internalDeployCommands(commands: ApplicationCommandData[], options: DeployOptions) {
	const rest = new REST({ version: "9" }).setToken(options.token);

	const route = options.deployGlobally
		? GLOBAL_DEPLOY_URL(options.applicationId)
		: GUILD_DEPLOY_URL(options.applicationId, options.guildId!);

	rest.put(route, {
		body: commands,
	});
}

export async function deployCommands(options: DeployOptions & { commandDir: string }) {
	let commands = await resolveModules(options.commandDir, (mod): mod is BaseCommand => mod instanceof BaseCommand);
	if (options.deployGlobally) commands = commands.filter((c) => !c.dontDeployGlobally);
	await internalDeployCommands(transformCommands(commands), options);
}

export async function deployOnChange(client: IubusClient, options: DeployOptions) {
	let local = client.commands;
	if (options.deployGlobally) local = local.filter((c) => !c.dontDeployGlobally);
	let existing: Collection<string, ApplicationCommand>;

	if (options.deployGlobally) {
		if (!client.application?.owner) await client.application?.fetch();
		existing = (await client.application?.commands.fetch()) ?? new Collection();
	} else {
		existing = await (await client.guilds.fetch(options.guildId)).commands.fetch();
	}

	const transformedLocal = transformCommands([...local.values()]);
	const transformedExisting = transformCommands([...existing.values()]);
	const equal = deepCompare(sortCommands(transformedLocal), sortCommands(transformedExisting));

	if (equal) return;
	await internalDeployCommands(transformedLocal, options);
}

export function sortCommands(commands: ApplicationCommandData[] | ApplicationCommandOptionData[]) {
	for (const cmd of commands) {
		if ("options" in cmd && cmd.options) {
			sortCommands(cmd.options);
		}
	}
	return commands.sort((a, b) => (b.name > a.name ? -1 : 1));
}

/** Transforms array of Iubus Commands or discord.js Application Commands to normalized Application Commands that can be sent to the Discord API */
export function transformCommands(
	commands: BaseCommand[] | ApplicationCommand[] | ApplicationCommandData[]
): ApplicationCommandData[] {
	return commands.map((c) => {
		return {
			name: c.name,
			type: c.type,
			description: "description" in c ? c.description : "",
			options: "options" in c && c.options ? c.options : [],
		};
	});
}

export type DeployOptions = LocalDeployOptions | GlobalDeployOptions;

export interface DeployOptionData {
	applicationId: string;
	token: string;
	deployGlobally?: boolean;
	guildId?: string;
}

export interface LocalDeployOptions extends DeployOptionData {
	deployGlobally?: false;
	guildId: string;
}

export interface GlobalDeployOptions extends DeployOptionData {
	deployGlobally: true;
	guildId: never;
}
