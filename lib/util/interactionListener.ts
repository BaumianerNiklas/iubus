import { ApplicationCommandType, Collection, Interaction } from "discord.js";
import { Inhibitor } from "../structures/Inhibitor.js";
import type { Command, SubcommandGroup, SubcommandMethod } from "../structures/Command.js";

export async function interactionListener(
	interaction: Interaction,
	commands: Collection<string, Command<ApplicationCommandType>>,
	inhibitors: Collection<string, Inhibitor>
) {
	if (!interaction.isAutocomplete() && !interaction.isCommand()) return;

	const { commandName } = interaction;
	const command = commands.get(commandName);
	if (!command) return;

	// Inhibitor checks
	if (command.inhibitors && interaction.isCommand()) {
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
	if (interaction.isAutocomplete()) {
		if (command.autocomplete) command.autocomplete(interaction);
	}

	// Regular slash commands
	if (interaction.isChatInputCommand() && command.type === ApplicationCommandType.ChatInput) {
		const cmd = command as Command<ApplicationCommandType.ChatInput>; // This type cast is safe but TS doesn't want to infer the generic

		// Subcommand handling
		const subcmd = interaction.options.getSubcommand(false);
		const subgroup = interaction.options.getSubcommandGroup(false);

		if (cmd.subcommands && (subcmd || subgroup)) {
			if (subgroup && subcmd && typeof cmd.subcommands[subgroup] === "object") {
				const group = cmd.subcommands[subgroup] as SubcommandGroup; // Again, this type cast *should* be safe
				if (typeof group[subcmd] === "function") await group[subcmd](interaction);
			} else if (!subgroup && subcmd && typeof cmd.subcommands[subcmd] === "function") {
				const method = cmd.subcommands[subcmd] as SubcommandMethod;
				await method(interaction);
			}
		}

		if (cmd.run) await cmd.run(interaction);

		// Context menu commands
	} else if (interaction.isUserContextMenuCommand() && command.type === ApplicationCommandType.User) {
		const cmd = command as Command<ApplicationCommandType.User>;
		if (cmd.run) await cmd.run(interaction);
	} else if (interaction.isMessageContextMenuCommand() && command.type === ApplicationCommandType.Message) {
		const cmd = command as Command<ApplicationCommandType.Message>;
		if (cmd.run) await cmd.run(interaction);
	}
}