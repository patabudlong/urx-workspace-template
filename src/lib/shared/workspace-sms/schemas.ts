import { z } from 'zod';
import { isE164PhoneNumber, normalizePhoneNumber } from '$lib/shared/phone';

const smsBodySchema = z
	.string()
	.trim()
	.min(1, 'Message is required')
	.max(1600, 'Message must be 1600 characters or fewer');

const smsToSchema = z
	.string()
	.trim()
	.transform(normalizePhoneNumber)
	.refine(isE164PhoneNumber, 'Enter a valid number with country code (e.g. +639171234567)');

export const sendWorkspaceSmsSchema = z.object({
	to: smsToSchema,
	body: smsBodySchema
});

export type SendWorkspaceSmsInput = z.infer<typeof sendWorkspaceSmsSchema>;

export const workspaceSmsMessagesQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type WorkspaceSmsMessagesQuery = z.infer<typeof workspaceSmsMessagesQuerySchema>;
