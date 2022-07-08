import { BaseCommand } from "../structures/Command.js";
import { resolveModules } from "./resolveModules.js";
import { REST } from "@discordjs/rest";
import {
	type ApplicationCommand,
	type ApplicationCommandData,
	type ApplicationCommandOptionData,
	type ApplicationCommandOption,
	Collection,
	Routes,
} from "discord.js";
import type { IubusClient } from "../structures/IubusClient.js";
import { deepCompare } from "./deepCompare.js";
import { emitIubusEvent } from "../structures/IubusEvent.js";

/**
 * Deploys raw, processed commands to the Discord API. This is used internally by Iubus both when manually and when automatically deploying commands.
 * @internal
 */
export async function baseDeployCommands(commands: ApplicationCommandData[], options: DeployOptions) {
	const rest = new REST({ version: "9" }).setToken(options.token);

	const route = options.deployGlobally
		? Routes.applicationCommands(options.applicationId)
		: Routes.applicationGuildCommands(options.applicationId, options.guildId);

	rest.put(route, {
		body: commands,
	});

	await emitIubusEvent("commandsDeployed", commands, options);
}

/**
 * Manually deploy commands to the Discord API. Iubus scans the command directory, processes the commands and sends them to the Discord API.
 * Do NOT call this function every time you start your bot and instead create a separate file/script for deploying.
 * If you want Iubus to automatically re-deploy your commands when there are changes, set  `deploy.deployOnChange` to `true` when initializing your `IubusClient`.
 */
export async function deployCommands(options: DeployOptions & { commandDir: string }) {
	let commands = await resolveModules(options.commandDir, (mod): mod is BaseCommand => mod instanceof BaseCommand);
	if (options.deployGlobally) commands = commands.filter((c) => !c.dontDeployGlobally);
	await baseDeployCommands(transformCommands(commands), options);
}

/**
 * Compares the local commands on disk and the ones on the Discord API and sees if their data has changed. If so, automatically re-deploy commands.
 * @internal
 */
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
	await baseDeployCommands(transformedLocal, options);
}

/**
 * Sort commands alphabetically by their name.
 * @internal
 */
export function sortCommands(commands: ApplicationCommandData[] | ApplicationCommandOptionData[]) {
	for (const cmd of commands) {
		if ("options" in cmd && cmd.options) {
			sortCommands(cmd.options);
		}
	}
	return commands.sort((a, b) => (b.name > a.name ? -1 : 1));
}

/**
 * Transforms array of Iubus Commands or discord.js Application Commands to normalized Application Commands that can be sent to the Discord API
 * @internal
 */
export function transformCommands(
	commands: BaseCommand[] | ApplicationCommand[] | ApplicationCommandData[]
): ApplicationCommandData[] {
	return commands.map((c) => {
		return {
			name: c.name,
			name_localizations: c.nameLocalizations,
			type: c.type,
			description: "description" in c ? c.description : "",
			description_localizations: "descriptionLocalizations" in c ? c.descriptionLocalizations ?? {} : {},
			default_member_permissions: c.defaultMemberPermissions?.toString(),
			dm_permission: c.dmPermission,
			options: "options" in c && c.options ? c.options.map(transformOption) : [],
		};
	});
}

/**
 * Transforms an ApplicationCommandOption with camelCased properties to one with snake_cased properties
 * @internal
 */
export function transformOption(option: ApplicationCommandOption | ApplicationCommandOptionData) {
	return {
		...option,
		name_localizations: option.nameLocalizations ?? {},
		description_localizations: option.descriptionLocalizations,
	};
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
}
