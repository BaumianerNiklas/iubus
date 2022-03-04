import {
	ApplicationCommandOptionData,
	ApplicationCommandType,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	MessageContextMenuCommandInteraction,
	UserContextMenuCommandInteraction,
} from "discord.js";
import type { Inhibitor } from "./Inhibitor.js";

export class Command<T extends ApplicationCommandType> implements CommandData<T> {
	public readonly type: T;
	public readonly name: string;
	public readonly description: string;
	public readonly options?: ChatInputOnly<T, ApplicationCommandOptionData[]>;
	public readonly subcommands?: ChatInputOnly<T, Subcommands>;
	public readonly inhibitors?: Array<string | Inhibitor>;

	public run?: RunMethod<T>;
	public autocomplete?: ChatInputOnly<T, (interaction: AutocompleteInteraction) => unknown>;

	constructor(data: CommandData<T>) {
		this.type = data.type;
		this.name = data.name;
		this.description = this.type === ApplicationCommandType.ChatInput ? data.description : "";
		this.options = data.options;
		this.run = data.run;

		if (data.subcommands) this.subcommands = data.subcommands;
		if (data.inhibitors) this.inhibitors = data.inhibitors;
		if (data.autocomplete) this.autocomplete = data.autocomplete;
	}
}

type RunMethod<T extends ApplicationCommandType> = T extends ApplicationCommandType.ChatInput
	? (interaction: ChatInputCommandInteraction) => unknown
	: T extends ApplicationCommandType.User
	? (interaction: UserContextMenuCommandInteraction) => unknown
	: T extends ApplicationCommandType.Message
	? (interaction: MessageContextMenuCommandInteraction) => unknown
	: never;

type ChatInputOnly<CommandType extends ApplicationCommandType, T> = CommandType extends ApplicationCommandType.ChatInput
	? T | undefined
	: never;

export interface CommandData<T extends ApplicationCommandType = ApplicationCommandType.ChatInput> {
	type: T;
	name: string;
	description: string;
	options?: ChatInputOnly<T, ApplicationCommandOptionData[]>;
	subcommands?: ChatInputOnly<T, Subcommands>;
	inhibitors?: Array<string | Inhibitor>;
	run?: RunMethod<T>;
	autocomplete?: ChatInputOnly<T, (interaction: AutocompleteInteraction) => unknown>;
}

export type Subcommands = Record<string, SubcommandMethod | SubcommandGroup>;

export type SubcommandMethod = (interaction: ChatInputCommandInteraction) => unknown;
export type SubcommandGroup = Record<string, SubcommandMethod>;
