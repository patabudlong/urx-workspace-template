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
				}
			}
		}
	};
}
