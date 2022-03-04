import { ApplicationCommandType, Client, ClientEvents, Collection } from "discord.js";
import { resolveModules } from "../util/resolveModules.js";
import { interactionListener } from "../util/interactionListener.js";
import { Command } from "./Command.js";
import { Event } from "./Event.js";
import { container } from "./Container.js";
import { Inhibitor } from "./Inhibitor.js";

/**
 * Singleton class for Iubus. This class sets up and controls all the logic needed for the framework to function after calling init().
 */
export class Iubus implements IubusData {
	/** The directory containing your command files. This has to be relative to where you start your node process. */
	public readonly commandDir?: string;
	public readonly eventDir?: string;
	public readonly inhibitorDir?: string;
	public readonly commands: Collection<string, Command<ApplicationCommandType>>;
	public readonly inhibitors: Collection<string, Inhibitor>;
	#initialized = false;

	constructor(data: IubusData) {
		this.commandDir = data.commandDir;
		this.eventDir = data.eventDir;
		this.inhibitorDir = data.inhibitorDir;
		this.commands = new Collection();
		this.inhibitors = new Collection();
	}

	public async init(client: Client) {
		if (this.#initialized) throw new Error("Cannot initialize twice.");

		if (this.commandDir) {
			const commands = (await resolveModules(
				this.commandDir,
				(mod) => mod instanceof Command
			)) as Command<ApplicationCommandType>[];
			for (const cmd of commands) {
				this.commands.set(cmd.name, cmd);
			}

			client.on("interactionCreate", async (interaction) => {
				await interactionListener(interaction, this.commands, this.inhibitors);
			});
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

		if (this.inhibitorDir) {
			const inhibitors = (await resolveModules(
				this.inhibitorDir,
				(mod) => mod instanceof Inhibitor
			)) as Inhibitor[];

			for (const inhibitor of inhibitors) {
				this.inhibitors.set(inhibitor.name, inhibitor);
			}
		}

		container.client = client;
		container.iubus = this;
		this.#initialized = true;
	}
}

export interface IubusData {
	commandDir?: string;
	eventDir?: string;
	inhibitorDir?: string;
}
