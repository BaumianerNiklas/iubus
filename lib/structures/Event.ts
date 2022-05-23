import type { ClientEvents } from "discord.js";

export class Event<E extends keyof ClientEvents = keyof ClientEvents> implements EventData<E> {
	public readonly name: E;
	public readonly once: boolean;
	public readonly run: (...args: ClientEvents[E]) => unknown;

	constructor(data: EventData<E>) {
		this.name = data.name;
		this.once = data.once ?? false;
		this.run = data.run;
	}
}

export interface EventData<E extends keyof ClientEvents> {
	name: E;
	once?: boolean;
	run: (...args: ClientEvents[E]) => unknown;
}
