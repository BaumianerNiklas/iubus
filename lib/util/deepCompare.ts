/** Recursive function that compares a and b and checks if they show all the same properties.
 * For objects, this only checks if all of the properties of a are in b and equal. If b has properties that a doesn't, this still returns true.
 *
 * This function is not ideal outside of internal uses in Iubus because of the above reason and this only working on primitives, arrays, and plain objects.*/
export function deepCompare(a: unknown, b: unknown): boolean {
	// Primitive checks (strings, number, booleans, null, undefined, NaN)
	if (Object.is(a, b)) return true;
	// This check is primarily for type safety later on
	if (!a || !b) return false;

	// If both value are arrays, check if all of their elements are equal
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		for (const [i, el] of a.entries()) {
			if (!deepCompare(el, b[i])) return false;
		}
		return true;

		// If both values are objects, check if all of the properties in a are in b and are equal
	} else if (typeof a === "object" && typeof b === "object") {
		for (const [key, val] of Object.entries(a)) {
			// @ts-expect-error TODO: get rid of the type error here
			if (!(key in b) || !deepCompare(val, b[key])) return false;
		}
		return true;
	}
	return false;
}
