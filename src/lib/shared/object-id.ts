const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

/** Client-safe MongoDB ObjectId string check (no `mongodb` import). */
export function isObjectIdString(value: string): boolean {
	return OBJECT_ID_PATTERN.test(value);
}
