import type { ObjectId } from 'mongodb';

export const CONSENT_EVENT_TYPES = {
	TERMS_SUBMIT: 'terms_submit'
} as const;

export type ConsentEventType = (typeof CONSENT_EVENT_TYPES)[keyof typeof CONSENT_EVENT_TYPES];

export const CONSENT_CONTEXTS = {
	SIGNUP: 'signup',
	LOGIN: 'login'
} as const;

export type ConsentContext = (typeof CONSENT_CONTEXTS)[keyof typeof CONSENT_CONTEXTS];

export type ConsentEventDocument = {
	_id: ObjectId;
	type: ConsentEventType;
	context: ConsentContext;
	ipAddress: string;
	userAgent?: string;
	email?: string;
	userId?: ObjectId;
	policyVersion: string;
	createdAt: Date;
};
