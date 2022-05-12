import { readdir, lstat } from "node:fs/promises";
import { join } from "node:path";

/**
 * Recursively resolves modules in path and filters them based on the predicate
 */
export async function resolveModules<T>(path: string, predicate: (module: unknown) => module is T): Promise<T[]> {
	const result: unknown[] = [];

	const files = await readdir(join(process.cwd(), path));
	for (const file of files) {
		const joinedPath = join(path, file);
		const stat = await lstat(joinedPath);
		if (stat.isDirectory()) {
			result.push(...(await resolveModules(joinedPath, predicate)));
		} else {
			if (!file.endsWith(".js")) continue;

			const fileExports = await import(join(process.cwd(), joinedPath));
			for (const module of Object.values(fileExports)) {
				if (!predicate(module)) continue;
				result.push(module);
			}
		}
	}
	return result as T[];
}
