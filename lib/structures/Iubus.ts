import { ApplicationCommandType, Client, ClientEvents, Collection } from "discord.js";
import { resolveModules } from "../util/resolveModules.js";
import { Command } from "./Command.js";
import { Event } from "./Event.js";
import { container } from "./Container.js";

/**
 * Singleton class for Iubus. This class sets up and controls all the logic needed for the framework to function after calling init().
 */
export class Iubus implements IubusData {
	/** The directory containing your command files. This has to be relative to where you start your node process. */
	public readonly commandDir?: string;
	public readonly eventDir?: string;
	public readonly commands: Collection<string, Command>;
	#initialized = false;

	constructor(data: IubusData) {
		this.commandDir = data.commandDir;
		this.eventDir = data.eventDir;
		this.commands = new Collection();
	}

	public async init(client: Client) {
		if (this.#initialized) throw new Error("Cannot initialize twice.");

		if (this.commandDir) {
			const commands = (await resolveModules(this.commandDir, (mod) => mod instanceof Command)) as Command[];
			for (const cmd of commands) {
				this.commands.set(cmd.name, cmd);
			}
		}

		if (this.eventDir) {
			const events = (await resolveModules(this.eventDir, (mod) => mod instanceof Event)) as Event<
				keyof ClientEvents
			>[];
			for (const event of events) {
				if (event.once) {
					client.once(event.name, (...args: ClientEvents[typeof event.name]) => {
						event.run(...args);
					});
				} else {
					client.on(event.name, (...args: ClientEvents[typeof event.name]) => {
						event.run(...args);
					});
				}
			}
		}

		this.setupInteractionListener(client);
		this.#initialized = true;

		container.client = client;
		container.iubus = this;
	}

	private async setupInteractionListener(client: Client) {
		client.on("interactionCreate", async (interaction) => {
			if (!interaction.isAutocomplete() && !interaction.isCommand()) return;

			const { commandName } = interaction;
			const command = this.commands.get(commandName);
			if (!command) return;

			// Autocomplete
			if (interaction.isAutocomplete()) {
				if (command.autocomplete) command.autocomplete(interaction);
			}

			// Regular slash commands
			if (interaction.isChatInputCommand() && command.type === ApplicationCommandType.ChatInput) {
				const subcmd = interaction.options.getSubcommand(false);
				const subgroup = interaction.options.getSubcommandGroup(false);

				if (subcmd && subgroup && command.subcommands) {
					const group = command.subcommands[subgroup];
					if (typeof group !== "object") {
						throw new Error(
							`Expected subcommand ${subgroup} on command ${
								command.name
							} to be of type object as it is a group. Instead found type ${typeof group}.`
						);
					}
					const method = group[subcmd];
					if (method) await method(interaction);
				} else if (subcmd) {
					const method = command.subcommands?.[subcmd];
					if (typeof method !== "function") {
						throw new Error(
							`Expected subcommand ${subcmd} on command ${
								command.name
							} to be of type function as it is not part of a group. Instead found type ${typeof method}.`
						);
					}
					if (method) await method(interaction);
				}

				if (command.run) await command.run(interaction);

				// Context menu commands
			} else if (interaction.isUserContextMenuCommand() && command.type === ApplicationCommandType.User) {
				if (command.run) await command.run(interaction);
			} else if (interaction.isMessageContextMenuCommand() && command.type === ApplicationCommandType.Message) {
				if (command.run) await command.run(interaction);
			}
		});
	}
}

export interface IubusData {
	commandDir?: string;
	eventDir?: string;
}
