import type { CommandInteraction } from "discord.js";

export class Inhibitor implements InhibitorData {
	name: string;
	run: (interaction: CommandInteraction) => boolean;

	constructor(data: InhibitorData) {
		this.name = data.name;
		this.run = data.run;
	}
}

export interface InhibitorData {
	name: string;
	run: (interaction: CommandInteraction) => boolean;
}
