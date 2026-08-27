import { formatTwilioSmsErrorMessage } from '$lib/server/sms/twilio-errors';
import { getTwilioConfig } from '$lib/server/workspace-sms/config';
import { sendTwilioSms } from '$lib/server/workspace-sms/twilio';
import {
	createWorkspaceSmsMessage,
	markWorkspaceSmsMessageFailed,
	markWorkspaceSmsMessageSent
} from '$lib/server/repositories/workspace-sms-messages';
import type { SendWorkspaceSmsInput } from '$lib/shared/workspace-sms/schemas';

export type SendWorkspaceSmsResult = {
	messageId: string;
	providerMessageId: string;
};

export async function sendWorkspaceSms(input: {
	workspaceId: string;
	sentByUserId: string;
	message: SendWorkspaceSmsInput;
}): Promise<SendWorkspaceSmsResult> {
	const config = getTwilioConfig();
	if (!config) {
		throw new Error('SMS transport is not configured');
	}

	const record = await createWorkspaceSmsMessage({
		workspaceId: input.workspaceId,
		sentByUserId: input.sentByUserId,
		to: input.message.to,
		body: input.message.body
	});

	try {
		const result = await sendTwilioSms(config, input.message);
		await markWorkspaceSmsMessageSent({
			messageId: record.id,
			providerMessageId: result.providerMessageId
		});

		return {
			messageId: record.id,
			providerMessageId: result.providerMessageId
		};
	} catch (error) {
		const message = formatTwilioSmsErrorMessage(error);
		await markWorkspaceSmsMessageFailed({
			messageId: record.id,
			error: message
		});
		throw new Error(message);
	}
}

export { isWorkspaceSmsConfigured } from '$lib/server/workspace-sms/config';
