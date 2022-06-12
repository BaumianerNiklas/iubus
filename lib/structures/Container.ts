import type { IubusClient } from "./IubusClient.js";

// Iubus Dependency Injection
// Literally just an empty object that gets mutated upon calling `Iubus#init` - bit of a dirty solution but it does the job
/**
 * Dependency Injection for Iubus; this contains your IubusClient and custom properties if you have defined them
 *
 * **WARNING**: If you have not called `IubusClient#login`, this container will **NOT** be populated! This is only typesafe if you have logged in your client!
 */
// @ts-expect-error ^ which is why this expect error is necessary
export const container: Container = {};

export interface Container {
	client: IubusClient;
}
