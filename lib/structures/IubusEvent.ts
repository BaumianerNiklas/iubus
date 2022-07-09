import type { ApplicationCommandData, AutocompleteInteraction, CommandInteraction } from "discord.js";
import type { BaseCommand, ChatInputCommand } from "./Command.js";
import { container } from "./Container.js";
import type { Inhibitor } from "./Inhibitor.js";
import type { DeployOptions } from "../util/commandDeployment.js";

export class IubusEvent<E extends keyof IubusEvents = keyof IubusEvents> implements IubusEventData<E> {
	public readonly name: E;
	public readonly run: (...args: IubusEvents[E]) => unknown;

	constructor(data: IubusEventData<E>) {
		this.name = data.name;
		this.run = data.run;
	}
}

/**
 * Emit a iubus event. If the client is not ready and thus not available in `container`, do nothing.
 * @internal
 */
export async function emitIubusEvent<E extends keyof IubusEvents>(event: E, ...payload: IubusEvents[E]) {
	const { client } = container;
	if (!client) return;

	await client.iubusEvents.get(event)?.run(...payload);
}

export interface IubusEventData<E extends keyof IubusEvents> {
	name: E;
	run: (...args: IubusEvents[E]) => unknown;
}

export interface IubusEvents {
	commandRun: [BaseCommand, CommandInteraction];
	autocompleteRun: [ChatInputCommand, AutocompleteInteraction];
	inhibitorRun: [boolean, CommandInteraction, BaseCommand, Inhibitor];
	commandsDeploy: [ApplicationCommandData[], DeployOptions];
}