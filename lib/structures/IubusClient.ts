import { Client, type ClientEvents, type ClientOptions, Collection } from "discord.js";
import { resolveModules } from "../util/resolveModules.js";
import { interactionListener } from "../util/interactionListener.js";
import { BaseCommand } from "./Command.js";
import { Event } from "./Event.js";
import { container } from "./Container.js";
import { Inhibitor } from "./Inhibitor.js";
import { deployOnChange, type DeployOptions } from "../util/commandDeployment.js";
import { emitIubusEvent, IubusEvent, type IubusEvents } from "./IubusEvent.js";

/**
 * The entry point to Iubus.
 * This serves as both a discord.js client and a singleton instance for Iubus that is processing everything to make the framework function.
 */
export class IubusClient extends Client {
	public readonly dirs?: DirectoryOptions;
	public readonly deploy?: DeployOptions & { deployOnChange?: boolean };
	public readonly commands: Collection<string, BaseCommand>;
	public readonly inhibitors: Collection<string, Inhibitor>;
	public readonly iubusEvents: Collection<keyof IubusEvents, IubusEvent>;
	#initialized = false;

	constructor(data: IubusClientOptions) {
		super(data);

		this.dirs = data.dirs;
		this.deploy = data.deploy;

		this.commands = new Collection();
		this.inhibitors = new Collection();
		this.iubusEvents = new Collection();
	}

	public async login(token?: string) {
		if (this.#initialized) throw new Error("Cannot initialize twice.");
		container.client = this;

		if (this.dirs?.iubusEvents) {
			const iubusEvents = await resolveModules(
				this.dirs.iubusEvents,
				(mod): mod is IubusEvent => mod instanceof IubusEvent
			);

			for (const event of iubusEvents) {
				this.iubusEvents.set(event.name, event);
			}
		}

		if (this.dirs?.commands) {
			const commands = await resolveModules(
				this.dirs.commands,
				(mod): mod is BaseCommand => mod instanceof BaseCommand
			);
			for (const cmd of commands) {
				this.commands.set(cmd.name, cmd);
				await emitIubusEvent("commandRegister", cmd);
			}

			if (this.deploy?.deployOnChange) {
				// TODO: figure out a way to do this without having the client logged in
				this.once("ready", async () => await deployOnChange(this, this.deploy!)); // Apparently TS doesn't want to infer deploy as non-null?
			}

			this.on("interactionCreate", async (interaction) => {
				await interactionListener(interaction, this.commands, this.inhibitors);
			});
		}

		if (this.dirs?.events) {
			const events = await resolveModules(this.dirs.events, (mod): mod is Event => mod instanceof Event);
			for (const event of events) {
				if (event.once) {
					this.once(event.name, (...args: ClientEvents[typeof event.name]) => {
						event.run(...args);
					});
				} else {
					this.on(event.name, (...args: ClientEvents[typeof event.name]) => {
						event.run(...args);
					});
				}
				await emitIubusEvent("eventRegister", event);
			}
		}

		if (this.dirs?.inhibitors) {
			const inhibitors = await resolveModules(
				this.dirs.inhibitors,
				(mod): mod is Inhibitor => mod instanceof Inhibitor
			);

			for (const inhibitor of inhibitors) {
				this.inhibitors.set(inhibitor.name, inhibitor);
				await emitIubusEvent("inhibitorRegister", inhibitor);
			}
		}

		this.#initialized = true;

		return super.login(token);
	}
}

export interface IubusClientOptions extends ClientOptions {
	dirs?: DirectoryOptions;
	deploy?: DeployOptions & { deployOnChange?: boolean };
}

export interface DirectoryOptions {
	commands?: string;
	events?: string;
	iubusEvents?: string;
	inhibitors?: string;
}
