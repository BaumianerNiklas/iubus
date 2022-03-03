export const GLOBAL_DEPLOY_URL = (applicationId: string) => `/applications/${applicationId}/commands` as const;
export const GUILD_DEPLOY_URL = (applicationId: string, guildId: string) =>
	`/applications/${applicationId}/guilds/${guildId}/commands` as const;
