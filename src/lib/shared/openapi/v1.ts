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
						'Registers a new workspace user with email and password. Returns a JWT for mobile clients (`Authorization: Bearer <token>`). Web apps may use the `/signup` form which sets an httpOnly session cookie.',
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
							description: 'Account created',
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
								'terms_checkbox',
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
					required: ['id', 'email', 'firstName', 'lastName'],
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
				}
			}
		}
	};
}
