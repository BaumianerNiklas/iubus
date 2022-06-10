import { type AnyInteraction, Collection, InteractionType } from "discord.js";
import { Inhibitor } from "../structures/Inhibitor.js";
import {
	BaseCommand,
	ChatInputCommand,
	MessageContextMenuCommand,
	SubcommandGroup,
	SubcommandMethod,
	UserContextMenuCommand,
} from "../structures/Command.js";

export async function interactionListener(
	interaction: AnyInteraction,
	commands: Collection<string, BaseCommand>,
	inhibitors: Collection<string, Inhibitor>
) {
	if (
		interaction.type !== InteractionType.ApplicationCommand &&
		interaction.type !== InteractionType.ApplicationCommandAutocomplete
	)
		return;

	const { commandName } = interaction;
	const command = commands.get(commandName);
	if (!command) return;

	// Inhibitor checks
	if (command.inhibitors && interaction.type === InteractionType.ApplicationCommand) {
		for (const selectedInhibitor of command.inhibitors) {
			let inhibitor: Inhibitor | undefined;
			if (typeof selectedInhibitor === "string") {
				inhibitor = inhibitors.get(selectedInhibitor);
			} else if (selectedInhibitor instanceof Inhibitor) {
				inhibitor = selectedInhibitor;
			}
			if (!inhibitor) continue;
			// Abort processing the interaction if an inhibitor inhibits the interaction
			if (!inhibitor.run(interaction)) return;
		}
	}

	// Autocomplete
	if (interaction.isAutocomplete() && command instanceof ChatInputCommand) {
		if (command.autocomplete) command.autocomplete(interaction);
	}

	// Regular slash commands
	if (interaction.isChatInputCommand() && command instanceof ChatInputCommand) {
		// Subcommand handling
		const subcmd = interaction.options.getSubcommand(false);
		const subgroup = interaction.options.getSubcommandGroup(false);

		if (command.subcommands && (subcmd || subgroup)) {
			if (subgroup && subcmd && typeof command.subcommands[subgroup] === "object") {
				const group = command.subcommands[subgroup] as SubcommandGroup; // Again, this type cast *should* be safe
				if (typeof group[subcmd] === "function") await group[subcmd](interaction);
			} else if (!subgroup && subcmd && typeof command.subcommands[subcmd] === "function") {
				const method = command.subcommands[subcmd] as SubcommandMethod;
				await method(interaction);
			}
		}

		if (command.run) await command.run(interaction);

		// Context menu commands
	} else if (interaction.isUserContextMenuCommand() && command instanceof UserContextMenuCommand) {
		if (command.run) await command.run(interaction);
	} else if (interaction.isMessageContextMenuCommand() && command instanceof MessageContextMenuCommand) {
		if (command.run) await command.run(interaction);
	}
}
