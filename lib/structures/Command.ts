import {
	type ApplicationCommandOptionData,
	ApplicationCommandType,
	type AutocompleteInteraction,
	type ChatInputCommandInteraction,
	type MessageContextMenuCommandInteraction,
	type UserContextMenuCommandInteraction,
} from "discord.js";
import type { Inhibitor } from "./Inhibitor.js";

export abstract class BaseCommand {
	public abstract readonly type: ApplicationCommandType;
	public readonly name: string;
	public readonly inhibitors?: Array<string | Inhibitor>;

	public abstract run?: ChatInputRunMethod | UserContextMenuRunMethod | MessageContextMenuRunMethod;

	constructor(data: BaseCommandData) {
		this.name = data.name;
		this.inhibitors = data.inhibitors;
	}
}

export class ChatInputCommand extends BaseCommand {
	public readonly type = ApplicationCommandType.ChatInput;
	public readonly description: string;
	public readonly options?: ApplicationCommandOptionData[];
	public readonly subcommands?: Subcommands;

	public run?: ChatInputRunMethod;
	public autocomplete?: (interaction: AutocompleteInteraction) => unknown;

	constructor(data: ChatInputCommandData) {
		super(data);
		this.description = data.description;
		this.options = data.options ?? [];
		this.subcommands = data.subcommands;

		this.run = data.run;
		this.autocomplete = data.autocomplete;
	}
}

export class UserContextMenuCommand extends BaseCommand {
	public readonly type = ApplicationCommandType.User;
	public run?: UserContextMenuRunMethod;

	constructor(data: Omit<BaseCommandData, "run"> & { run?: UserContextMenuRunMethod }) {
		super(data);
		this.run = data.run;
	}
}

export class MessageContextMenuCommand extends BaseCommand {
	public readonly type = ApplicationCommandType.Message;
	public run?: MessageContextMenuRunMethod;

	constructor(data: Omit<BaseCommandData, "run"> & { run?: MessageContextMenuRunMethod }) {
		super(data);
		this.run = data.run;
	}
}

export type Subcommands = Record<string, SubcommandMethod | SubcommandGroup>;
export type SubcommandMethod = (interaction: ChatInputCommandInteraction) => unknown;
export type SubcommandGroup = Record<string, SubcommandMethod>;

export interface BaseCommandData {
	name: string;
	inhibitors?: Array<string | Inhibitor>;
	run?: ChatInputRunMethod | UserContextMenuRunMethod | MessageContextMenuRunMethod;
}

export interface ChatInputCommandData extends BaseCommandData {
	description: string;
	options?: ApplicationCommandOptionData[];
	subcommands?: Subcommands;
	autocomplete?: (interaction: AutocompleteInteraction) => unknown;
	run?: (interaction: ChatInputCommandInteraction) => unknown;
}

export type ChatInputRunMethod = (interaction: ChatInputCommandInteraction) => unknown;
export type UserContextMenuRunMethod = (interaction: UserContextMenuCommandInteraction) => unknown;
export type MessageContextMenuRunMethod = (interaction: MessageContextMenuCommandInteraction) => unknown;
