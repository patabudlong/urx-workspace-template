import { isObjectIdString } from '$lib/shared/object-id';

export function match(param: string): boolean {
	return isObjectIdString(param);
}
