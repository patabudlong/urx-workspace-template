export type SmsMessage = {
	to: string;
	body: string;
};

export type SmsTransport = {
	send(message: SmsMessage): Promise<void>;
};
