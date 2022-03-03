import {
	ApplicationCommandOptionData,
	ApplicationCommandType,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	CommandInteraction,
} from "discord.js";

export class Command implements CommandData {
	public readonly type: ApplicationCommandType;
	public readonly name: string;
	public readonly description: string;
	public readonly options: ApplicationCommandOptionData[];
	public readonly subcommands?: Subcommands;

	public run?: (interaction: CommandInteraction) => unknown;
	public autocomplete?: (interaction: AutocompleteInteraction) => unknown;

	constructor(data: ChatInputCommandData | ContextMenuCommandData) {
		this.type = data.type ?? ApplicationCommandType.ChatInput;
		this.name = data.name;
		this.description = this.type === ApplicationCommandType.ChatInput ? data.description : "";
		this.options = data.options ?? [];
		this.run = data.run;

		if (data.subcommands) this.subcommands = data.subcommands;
		if (data.autocomplete) this.autocomplete = data.autocomplete;
	}
}

export interface CommandData {
	type?: ApplicationCommandType;
	name: string;
	description: string;
	options?: ApplicationCommandOptionData[];
	subcommands?: Subcommands;
	run?: (interaction: CommandInteraction) => unknown;
	autocomplete?: (interaction: AutocompleteInteraction) => unknown;
}

export interface ChatInputCommandData extends CommandData {
	type?: ApplicationCommandType.ChatInput;
	subcommands?: Subcommands;
}

export interface ContextMenuCommandData extends CommandData {
	type: ApplicationCommandType.Message | ApplicationCommandType.User;
	options: never;
	subcommands: never;
	autocomplete: never;
}

export type Subcommands = SingleSubcommands | GroupedSubcommands;
export type SingleSubcommands = Record<string, SubcommandMethod>;
export type GroupedSubcommands = Record<string, SubcommandGroup>;

export type SubcommandMethod = (interaction: ChatInputCommandInteraction) => unknown;
export type SubcommandGroup = Record<string, SubcommandMethod>;
