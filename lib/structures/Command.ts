import {
	type ApplicationCommandOptionData,
	ApplicationCommandType,
	type AutocompleteInteraction,
	type ChatInputCommandInteraction,
	type MessageContextMenuCommandInteraction,
	type UserContextMenuCommandInteraction,
	type LocalizationMap,
	type Permissions,
} from "discord.js";
import type { Inhibitor } from "./Inhibitor.js";

/**
 * An abstract base class for all other command classes. This contains properties every command can have, like name, permissions, and inhibitors.
 * @internal
 */
export abstract class BaseCommand {
	public abstract readonly type: ApplicationCommandType;
	public readonly name: string;
	public readonly nameLocalizations?: LocalizationMap;
	public readonly defaultMemberPermissions?: Permissions | bigint | number;
	public readonly dmPermission?: boolean;
	public readonly dontDeployGlobally: boolean;
	public readonly inhibitors?: Array<string | Inhibitor>;

	public abstract run?: ChatInputRunMethod | UserContextMenuRunMethod | MessageContextMenuRunMethod;

	constructor(data: BaseCommandData) {
		this.name = data.name;
		this.nameLocalizations = data.nameLocalizations;
		this.defaultMemberPermissions = data.defaultMemberPermissions;
		this.dmPermission = data.dmPermission;
		this.inhibitors = data.inhibitors;
		this.dontDeployGlobally = data.dontDeployGlobally ?? false;
	}
}

/**
 * Class for creating CHAT_INPUT commands (application command type 1)
 */
export class ChatInputCommand extends BaseCommand {
	public readonly type = ApplicationCommandType.ChatInput;
	public readonly description: string;
	public readonly descriptionLocalizations?: LocalizationMap;
	public readonly options?: ApplicationCommandOptionData[];
	public readonly subcommands?: Subcommands;

	public run?: ChatInputRunMethod;
	public autocomplete?: (interaction: AutocompleteInteraction) => unknown;

	constructor(data: ChatInputCommandData) {
		super(data);
		this.description = data.description;
		this.descriptionLocalizations = data.descriptionLocalizations;
		this.options = data.options ?? [];
		this.subcommands = data.subcommands;

		this.run = data.run;
		this.autocomplete = data.autocomplete;
	}
}

/**
 * Class for creating USER context menu commands (application command type 2)
 */
export class UserContextMenuCommand extends BaseCommand {
	public readonly type = ApplicationCommandType.User;
	public run?: UserContextMenuRunMethod;

	constructor(data: Omit<BaseCommandData, "run"> & { run?: UserContextMenuRunMethod }) {
		super(data);
		this.run = data.run;
	}
}

/**
 * Class for creating MESSAGE context menu commands (application command type 3)
 */
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
	nameLocalizations?: LocalizationMap;
	defaultMemberPermissions?: Permissions | bigint | number;
	dmPermission?: boolean;
	dontDeployGlobally?: boolean;
	inhibitors?: Array<string | Inhibitor>;
	run?: ChatInputRunMethod | UserContextMenuRunMethod | MessageContextMenuRunMethod;
}

export interface ChatInputCommandData extends BaseCommandData {
	description: string;
	descriptionLocalizations?: LocalizationMap;
	options?: ApplicationCommandOptionData[];
	subcommands?: Subcommands;
	autocomplete?: (interaction: AutocompleteInteraction) => unknown;
	run?: (interaction: ChatInputCommandInteraction) => unknown;
}

export type ChatInputRunMethod = (interaction: ChatInputCommandInteraction) => unknown;
export type UserContextMenuRunMethod = (interaction: UserContextMenuCommandInteraction) => unknown;
export type MessageContextMenuRunMethod = (interaction: MessageContextMenuCommandInteraction) => unknown;
