type OpenApiDocument = {
	openapi: string;
	info: {
		title: string;
		version: string;
		description: string;
	};
	servers: Array<{ url: string; description: string }>;
	tags: Array<{ name: string; description: string }>;
	paths: Record<string, unknown>;
	components: Record<string, unknown>;
};

/**
 * OpenAPI 3.1 document for `/api/v1`.
 * Update this file when adding or changing mobile-facing API routes.
 */
export function createOpenApiV1Document(requestOrigin: string): OpenApiDocument {
	const apiBaseUrl = `${requestOrigin}/api/v1`;

	return {
		openapi: '3.1.0',
		info: {
			title: 'URX Workspace API',
			version: '1.0.0',
			description:
				'Versioned JSON API for web and mobile clients. All success responses use `{ data, meta }`; errors use `{ error, meta }`.'
		},
		servers: [
			{
				url: apiBaseUrl,
				description: 'API v1'
			}
		],
		tags: [
			{
				name: 'System',
				description: 'Health and operational endpoints'
			},
			{
				name: 'Auth',
				description: 'Authentication for web sessions and mobile Bearer tokens'
			},
			{
				name: 'Workspaces',
				description: 'Workspace onboarding and availability'
			}
		],
		paths: {
			'/health': {
				get: {
					tags: ['System'],
					summary: 'Health check',
					description:
						'Reports API and database connectivity. Mobile apps can poll this endpoint for offline/degraded UI states.',
					operationId: 'getHealth',
					parameters: [
						{
							$ref: '#/components/parameters/XRequestId'
						}
					],
					responses: {
						'200': {
							description: 'API is healthy and database is reachable',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/HealthSuccessResponse'
									}
								}
							}
						},
						'503': {
							description: 'API is degraded (typically database unavailable)',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/HealthSuccessResponse'
									}
								}
							}
						}
					}
				}
			},
			'/auth/login': {
				post: {
					tags: ['Auth'],
					summary: 'Sign in',
					description:
						'Authenticates with email and password. Returns a JWT for mobile clients (`Authorization: Bearer <token>`). Web apps may also use the `/login` form which sets an httpOnly session cookie.',
					operationId: 'login',
					parameters: [
						{
							$ref: '#/components/parameters/XRequestId'
						}
					],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/LoginRequest'
								}
							}
						}
					},
					responses: {
						'200': {
							description: 'Authentication successful',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/LoginSuccessResponse'
									}
								}
							}
						},
						'400': {
							description: 'Invalid request body',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						},
						'401': {
							description: 'Invalid email or password',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						},
						'503': {
							description: 'Authentication is not configured (missing JWT_SECRET)',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						}
					}
				}
			},
			'/auth/signup': {
				post: {
					tags: ['Auth'],
					summary: 'Create account',
					description:
						'Registers a new workspace user with email and password. Sends a verification code to the email address. Sign in after verifying via POST /auth/verify-email.',
					operationId: 'signup',
					parameters: [
						{
							$ref: '#/components/parameters/XRequestId'
						}
					],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/SignupRequest'
								}
							}
						}
					},
					responses: {
						'201': {
							description: 'Account created; verification email sent',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/SignupSuccessResponse'
									}
								}
							}
						},
						'400': {
							description: 'Invalid request body',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						},
						'409': {
							description: 'An account with this email already exists',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						},
						'503': {
							description: 'Authentication is not configured (missing JWT_SECRET)',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						}
					}
				}
			},
			'/auth/consent': {
				post: {
					tags: ['Auth'],
					summary: 'Record consent event',
					description:
						'Logs terms checkbox or social sign-in interactions with timestamp and client IP for compliance auditing.',
					operationId: 'recordConsent',
					parameters: [
						{
							$ref: '#/components/parameters/XRequestId'
						}
					],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/RecordConsentRequest'
								}
							}
						}
					},
					responses: {
						'201': {
							description: 'Consent event recorded',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/RecordConsentSuccessResponse'
									}
								}
							}
						},
						'400': {
							description: 'Invalid request body',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						}
					}
				}
			},
			'/auth/logout': {
				post: {
					tags: ['Auth'],
					summary: 'Sign out (POST)',
					description:
						'Clears the web session cookie (`urx_session`). Mobile clients should discard stored tokens locally.',
					operationId: 'logoutPost',
					parameters: [
						{
							$ref: '#/components/parameters/XRequestId'
						}
					],
					responses: {
						'200': {
							description: 'Session cleared',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/LogoutSuccessResponse'
									}
								}
							}
						}
					}
				},
				get: {
					tags: ['Auth'],
					summary: 'Sign out (GET)',
					description: 'Same as POST — clears the web session cookie.',
					operationId: 'logoutGet',
					parameters: [
						{
							$ref: '#/components/parameters/XRequestId'
						}
					],
					responses: {
						'200': {
							description: 'Session cleared',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/LogoutSuccessResponse'
									}
								}
							}
						}
					}
				}
			},
			'/auth/forgot-password': {
				post: {
					tags: ['Auth'],
					summary: 'Request password reset',
					description:
						'Sends a password reset email when an account with a password exists. Always returns the same success message to avoid email enumeration.',
					operationId: 'forgotPassword',
					parameters: [
						{
							$ref: '#/components/parameters/XRequestId'
						}
					],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/ForgotPasswordRequest'
								}
							}
						}
					},
					responses: {
						'200': {
							description: 'Reset email queued (or no-op if account not found)',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ForgotPasswordSuccessResponse'
									}
								}
							}
						},
						'400': {
							description: 'Invalid request body',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						},
						'503': {
							description: 'Email service unavailable',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						}
					}
				}
			},
			'/auth/resend-verification': {
				post: {
					tags: ['Auth'],
					summary: 'Resend verification email',
					description:
						'Sends a verification email with a 6-digit code when an unverified account exists. Always returns the same success message to avoid email enumeration.',
					operationId: 'resendVerification',
					parameters: [
						{
							$ref: '#/components/parameters/XRequestId'
						}
					],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/ResendVerificationRequest'
								}
							}
						}
					},
					responses: {
						'200': {
							description: 'Verification email queued (or no-op if account not found)',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ResendVerificationSuccessResponse'
									}
								}
							}
						},
						'400': {
							description: 'Invalid request body',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						},
						'503': {
							description: 'Email service unavailable',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						}
					}
				}
			},
			'/auth/reset-password': {
				post: {
					tags: ['Auth'],
					summary: 'Reset password',
					description:
						'Sets a new password using a valid reset token from the email link. The new password must meet strength requirements and cannot match the current password or any of the last five previous passwords.',
					operationId: 'resetPassword',
					parameters: [
						{
							$ref: '#/components/parameters/XRequestId'
						}
					],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/ResetPasswordRequest'
								}
							}
						}
					},
					responses: {
						'200': {
							description: 'Password updated',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ResetPasswordSuccessResponse'
									}
								}
							}
						},
						'400': {
							description: 'Invalid token or request body',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						}
					}
				}
			},
			'/auth/verify-email': {
				post: {
					tags: ['Auth'],
					summary: 'Verify email with code',
					description:
						'Confirms an email address using the 6-digit code sent to the user.',
					operationId: 'verifyEmail',
					parameters: [
						{
							$ref: '#/components/parameters/XRequestId'
						}
					],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/VerifyEmailRequest'
								}
							}
						}
					},
					responses: {
						'200': {
							description: 'Email verified',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/VerifyEmailSuccessResponse'
									}
								}
							}
						},
						'400': {
							description: 'Invalid or expired verification code',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						},
						'409': {
							description: 'Email already verified',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						}
					}
				}
			},
			'/workspaces/availability': {
				get: {
					tags: ['Workspaces'],
					summary: 'Check workspace name and slug availability',
					description:
						'Returns whether a workspace display name and/or URL slug is available before onboarding submission. Requires authentication.',
					operationId: 'getWorkspaceAvailability',
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							$ref: '#/components/parameters/XRequestId'
						},
						{
							name: 'name',
							in: 'query',
							required: false,
							schema: { type: 'string' },
							description: 'Workspace display name to check (case-insensitive)'
						},
						{
							name: 'slug',
							in: 'query',
							required: false,
							schema: { type: 'string' },
							description: 'Workspace URL slug to check'
						}
					],
					responses: {
						'200': {
							description: 'Availability result for the requested fields',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/WorkspaceAvailabilitySuccessResponse'
									}
								}
							}
						},
						'400': {
							description: 'Invalid query parameters',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						}
					}
				}
			}
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					description: 'Bearer token for mobile and API clients'
				}
			},
			parameters: {
				XRequestId: {
					name: 'X-Request-Id',
					in: 'header',
					required: false,
					description: 'Optional client-generated trace id (UUID recommended)',
					schema: {
						type: 'string'
					}
				},
				XApiVersion: {
					name: 'X-Api-Version',
					in: 'header',
					required: false,
					description: 'Optional API version hint',
					schema: {
						type: 'string',
						example: 'v1'
					}
				}
			},
			schemas: {
				ApiMeta: {
					type: 'object',
					required: ['version', 'timestamp'],
					properties: {
						requestId: {
							type: 'string',
							description: 'Echoed when provided via X-Request-Id'
						},
						version: {
							type: 'string',
							example: 'v1'
						},
						timestamp: {
							type: 'string',
							format: 'date-time'
						}
					}
				},
				ApiErrorBody: {
					type: 'object',
					required: ['code', 'message'],
					properties: {
						code: {
							type: 'string',
							enum: [
								'BAD_REQUEST',
								'UNAUTHORIZED',
								'FORBIDDEN',
								'NOT_FOUND',
								'CONFLICT',
								'RATE_LIMITED',
								'INTERNAL_ERROR',
								'SERVICE_UNAVAILABLE'
							]
						},
						message: {
							type: 'string'
						},
						details: {
							type: 'object',
							additionalProperties: true
						}
					}
				},
				ApiErrorResponse: {
					type: 'object',
					required: ['error', 'meta'],
					properties: {
						error: {
							$ref: '#/components/schemas/ApiErrorBody'
						},
						meta: {
							$ref: '#/components/schemas/ApiMeta'
						}
					}
				},
				DatabaseHealth: {
					oneOf: [
						{
							type: 'object',
							required: ['ok', 'latencyMs'],
							properties: {
								ok: {
									type: 'boolean',
									const: true
								},
								latencyMs: {
									type: 'integer',
									minimum: 0
								}
							}
						},
						{
							type: 'object',
							required: ['ok', 'error'],
							properties: {
								ok: {
									type: 'boolean',
									const: false
								},
								error: {
									type: 'string'
								}
							}
						}
					]
				},
				HealthData: {
					type: 'object',
					required: ['status', 'services'],
					properties: {
						status: {
							type: 'string',
							enum: ['healthy', 'degraded']
						},
						services: {
							type: 'object',
							required: ['api', 'database'],
							properties: {
								api: {
									type: 'object',
									required: ['ok'],
									properties: {
										ok: {
											type: 'boolean'
										}
									}
								},
								database: {
									$ref: '#/components/schemas/DatabaseHealth'
								}
							}
						}
					}
				},
				HealthSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: {
							$ref: '#/components/schemas/HealthData'
						},
						meta: {
							$ref: '#/components/schemas/ApiMeta'
						}
					}
				},
				LoginRequest: {
					type: 'object',
					required: ['email', 'password'],
					properties: {
						email: {
							type: 'string',
							format: 'email',
							example: 'admin@urx.local'
						},
						password: {
							type: 'string',
							minLength: 8,
							format: 'password',
							example: 'changeme123'
						},
						recaptchaToken: {
							type: 'string',
							description: 'Google reCAPTCHA v3 token (required when reCAPTCHA is enabled)'
						}
					}
				},
				SignupRequest: {
					type: 'object',
					required: ['firstName', 'lastName', 'email', 'password', 'acceptedTerms'],
					properties: {
						firstName: {
							type: 'string',
							minLength: 1,
							maxLength: 60,
							example: 'Jane'
						},
						lastName: {
							type: 'string',
							minLength: 1,
							maxLength: 60,
							example: 'Smith'
						},
						email: {
							type: 'string',
							format: 'email',
							example: 'jane@company.com'
						},
						password: {
							type: 'string',
							minLength: 8,
							format: 'password',
							description:
								'Must include uppercase, lowercase, number, and special character',
							example: 'Changeme123!'
						},
						recaptchaToken: {
							type: 'string',
							description: 'Google reCAPTCHA v3 token (required when reCAPTCHA is enabled)'
						},
						acceptedTerms: {
							type: 'boolean',
							const: true,
							description:
								'Must be true to confirm agreement with the Terms of Service and Privacy Notice'
						}
					}
				},
				RecordConsentRequest: {
					type: 'object',
					required: ['type', 'context', 'policyVersion'],
					properties: {
						type: {
							type: 'string',
							enum: [
								'terms_submit',
								'social_login_google',
								'social_login_apple',
								'social_login_facebook'
							]
						},
						context: {
							type: 'string',
							enum: ['signup', 'login']
						},
						policyVersion: {
							type: 'string',
							example: '2026-08-01'
						},
						email: {
							type: 'string',
							format: 'email'
						}
					}
				},
				RecordConsentSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: {
							type: 'object',
							required: ['id', 'recordedAt'],
							properties: {
								id: {
									type: 'string'
								},
								recordedAt: {
									type: 'string',
									format: 'date-time'
								}
							}
						},
						meta: {
							$ref: '#/components/schemas/ApiMeta'
						}
					}
				},
				AuthUser: {
					type: 'object',
					required: ['id', 'email', 'firstName', 'lastName', 'emailVerified'],
					properties: {
						id: {
							type: 'string',
							description: 'User id (Mongo ObjectId as string)'
						},
						email: {
							type: 'string',
							format: 'email'
						},
						firstName: {
							type: 'string',
							example: 'Jane'
						},
						lastName: {
							type: 'string',
							example: 'Smith'
						},
						emailVerified: {
							type: 'boolean',
							description: 'Whether the user has confirmed their email address'
						}
					}
				},
				SignupSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: {
							type: 'object',
							required: ['user', 'message'],
							properties: {
								user: {
									$ref: '#/components/schemas/AuthUser'
								},
								message: {
									type: 'string'
								}
							}
						},
						meta: {
							$ref: '#/components/schemas/ApiMeta'
						}
					}
				},
				LoginData: {
					type: 'object',
					required: ['accessToken', 'tokenType', 'expiresIn', 'user'],
					properties: {
						accessToken: {
							type: 'string',
							description: 'JWT access token'
						},
						tokenType: {
							type: 'string',
							const: 'Bearer'
						},
						expiresIn: {
							type: 'integer',
							description: 'Token lifetime in seconds',
							example: 604800
						},
						user: {
							$ref: '#/components/schemas/AuthUser'
						}
					}
				},
				LoginSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: {
							$ref: '#/components/schemas/LoginData'
						},
						meta: {
							$ref: '#/components/schemas/ApiMeta'
						}
					}
				},
				LogoutData: {
					type: 'object',
					required: ['loggedOut'],
					properties: {
						loggedOut: {
							type: 'boolean',
							const: true
						}
					}
				},
				LogoutSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: {
							$ref: '#/components/schemas/LogoutData'
						},
						meta: {
							$ref: '#/components/schemas/ApiMeta'
						}
					}
				},
				ForgotPasswordRequest: {
					type: 'object',
					required: ['email'],
					properties: {
						email: {
							type: 'string',
							format: 'email',
							example: 'admin@urx.local'
						},
						recaptchaToken: {
							type: 'string',
							description: 'Google reCAPTCHA v3 token (required when reCAPTCHA is enabled)'
						}
					}
				},
				ForgotPasswordSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: {
							type: 'object',
							required: ['message'],
							properties: {
								message: {
									type: 'string'
								}
							}
						},
						meta: {
							$ref: '#/components/schemas/ApiMeta'
						}
					}
				},
				ResendVerificationRequest: {
					type: 'object',
					required: ['email'],
					properties: {
						email: {
							type: 'string',
							format: 'email',
							example: 'admin@urx.local'
						},
						recaptchaToken: {
							type: 'string',
							description: 'Google reCAPTCHA v3 token (required when reCAPTCHA is enabled)'
						}
					}
				},
				ResendVerificationSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: {
							type: 'object',
							required: ['message'],
							properties: {
								message: {
									type: 'string'
								}
							}
						},
						meta: {
							$ref: '#/components/schemas/ApiMeta'
						}
					}
				},
				VerifyEmailRequest: {
					type: 'object',
					required: ['email', 'code'],
					properties: {
						email: {
							type: 'string',
							format: 'email',
							example: 'admin@urx.local'
						},
						code: {
							type: 'string',
							pattern: '^\\d{6}$',
							description: '6-digit verification code from the email',
							example: '123456'
						},
						recaptchaToken: {
							type: 'string',
							description: 'Google reCAPTCHA v3 token (required when reCAPTCHA is enabled)'
						}
					}
				},
				VerifyEmailSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: {
							type: 'object',
							required: ['verified'],
							properties: {
								verified: {
									type: 'boolean',
									example: true
								}
							}
						},
						meta: {
							$ref: '#/components/schemas/ApiMeta'
						}
					}
				},
				ResetPasswordRequest: {
					type: 'object',
					required: ['token', 'password'],
					properties: {
						token: {
							type: 'string',
							description: 'Reset token from the email link'
						},
						password: {
							type: 'string',
							minLength: 8,
							format: 'password',
							description:
								'Must include uppercase, lowercase, number, and special character'
						},
						recaptchaToken: {
							type: 'string',
							description: 'Google reCAPTCHA v3 token (required when reCAPTCHA is enabled)'
						}
					}
				},
				ResetPasswordSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: {
							type: 'object',
							required: ['passwordUpdated'],
							properties: {
								passwordUpdated: {
									type: 'boolean',
									const: true
								}
							}
						},
						meta: {
							$ref: '#/components/schemas/ApiMeta'
						}
					}
				},
				WorkspaceAvailabilitySuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: {
							type: 'object',
							properties: {
								name: {
									type: 'object',
									required: ['available'],
									properties: {
										available: { type: 'boolean' }
									}
								},
								slug: {
									type: 'object',
									required: ['available'],
									properties: {
										available: { type: 'boolean' }
									}
								}
							}
						},
						meta: {
							$ref: '#/components/schemas/ApiMeta'
						}
					}
				}
			}
		}
	};
}
