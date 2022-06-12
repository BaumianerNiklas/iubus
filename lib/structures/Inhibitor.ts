import type { CommandInteraction } from "discord.js";

/**
 * Class for creating inhibitors. These can be added to the `inhibitors` field of commands, either by direct reference or name.
 * When an inhibitor is added to a command, its `run` method will get called every time before the actual command is executed.
 * If the run method returns `false` the command will not be executed.
 */
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
