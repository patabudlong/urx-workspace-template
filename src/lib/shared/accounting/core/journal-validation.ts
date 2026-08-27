import { z } from 'zod';
import { ACCOUNTING_JOURNAL_SOURCES } from '$lib/shared/accounting/journal-sources';

export const journalLineInputSchema = z.object({
	accountId: z.string().trim().min(1, 'Account is required'),
	description: z.string().trim().max(500).optional().default(''),
	debitCents: z.number().int().min(0),
	creditCents: z.number().int().min(0)
});

export const createJournalEntrySchema = z
	.object({
		periodId: z.string().trim().min(1, 'Fiscal period is required'),
		entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
		reference: z.string().trim().max(64).optional().default(''),
		memo: z.string().trim().max(1000).optional().default(''),
		source: z.enum(ACCOUNTING_JOURNAL_SOURCES).optional().default('manual'),
		lines: z.array(journalLineInputSchema).min(2, 'At least two lines are required')
	})
	.superRefine((value, ctx) => {
		let totalDebits = 0;
		let totalCredits = 0;

		for (const [index, line] of value.lines.entries()) {
			const hasDebit = line.debitCents > 0;
			const hasCredit = line.creditCents > 0;

			if (hasDebit === hasCredit) {
				ctx.addIssue({
					code: 'custom',
					message: 'Each line must have either a debit or a credit amount',
					path: ['lines', index]
				});
			}

			totalDebits += line.debitCents;
			totalCredits += line.creditCents;
		}

		if (totalDebits !== totalCredits) {
			ctx.addIssue({
				code: 'custom',
				message: 'Total debits must equal total credits',
				path: ['lines']
			});
		}

		if (totalDebits === 0) {
			ctx.addIssue({
				code: 'custom',
				message: 'Journal entry must have a non-zero amount',
				path: ['lines']
			});
		}
	});

export type JournalLineInput = z.infer<typeof journalLineInputSchema>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;

export function sumJournalLineDebits(lines: readonly { debitCents: number }[]): number {
	return lines.reduce((sum, line) => sum + line.debitCents, 0);
}

export function sumJournalLineCredits(lines: readonly { creditCents: number }[]): number {
	return lines.reduce((sum, line) => sum + line.creditCents, 0);
}
