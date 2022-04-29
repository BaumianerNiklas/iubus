import { Client, type ClientEvents, type ClientOptions, Collection } from "discord.js";
import { resolveModules } from "../util/resolveModules.js";
import { interactionListener } from "../util/interactionListener.js";
import { BaseCommand } from "./Command.js";
import { Event } from "./Event.js";
import { container } from "./Container.js";
import { Inhibitor } from "./Inhibitor.js";
import { deployOnChange, DeployOptions } from "../util/commandDeployment.js";

/**
 * The entry point to Iubus.
 * This serves as both a discord.js client and a singleton instance for Iubus that is processing everything to make the framework function.
 */
export class IubusClient extends Client {
	/** The directory containing your command files. This has to be relative to where you start your node process. */
	public readonly commandDir?: string;
	public readonly eventDir?: string;
	public readonly inhibitorDir?: string;
	public readonly deploy?: DeployOptions & { deployOnChange?: boolean };
	public readonly commands: Collection<string, BaseCommand>;
	public readonly inhibitors: Collection<string, Inhibitor>;
	#initialized = false;

	constructor(data: IubusClientOptions) {
		super(data);

		this.commandDir = data.commandDir;
		this.eventDir = data.eventDir;
		this.inhibitorDir = data.inhibitorDir;
		this.deploy = data.deploy;

		this.commands = new Collection();
		this.inhibitors = new Collection();
	}

	public async login(token?: string) {
		if (this.#initialized) throw new Error("Cannot initialize twice.");

		if (this.commandDir) {
			const commands = (await resolveModules(
				this.commandDir,
				(mod) => mod instanceof BaseCommand
			)) as BaseCommand[];
			for (const cmd of commands) {
				this.commands.set(cmd.name, cmd);
			}

			if (this.deploy?.deployOnChange) {
				// TODO: figure out a way to do this without having the client logged in
				this.once("ready", async () => await deployOnChange(this, this.deploy!)); // Apparently TS doesn't want to infer deploy as non-null?
			}

			this.on("interactionCreate", async (interaction) => {
				await interactionListener(interaction, this.commands, this.inhibitors);
			});
		}

		if (this.eventDir) {
			const events = (await resolveModules(this.eventDir, (mod) => mod instanceof Event)) as Event<
				keyof ClientEvents
			>[];
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

		container.client = this;
		this.#initialized = true;

		return super.login(token);
	}
}

export interface IubusClientOptions extends ClientOptions {
	commandDir?: string;
	eventDir?: string;
	inhibitorDir?: string;
	deploy?: DeployOptions & { deployOnChange?: boolean };
}
