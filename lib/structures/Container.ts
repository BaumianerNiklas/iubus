import type { Client } from "discord.js";
import type { Iubus } from "./Iubus.js";

// Iubus Dependency Injection
// Literally just an empty object that gets mutated upon calling `Iubus#init` - bit of a dirty solution but it does the job
/**
 * Dependency Injection for Iubus; this contains your client and Iubus instance ---
 * **WARNING**: If you have not called `Iubus#init`, this container will **NOT** be populated! This is only typesafe if you have initialized Iubus!
 */
// @ts-expect-error ^ which is why this expect error is necessary
export const container: Container = {};

export interface Container {
	client: Client;
	iubus: Iubus;
}
