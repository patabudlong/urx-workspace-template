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
			},
			{
				name: 'Users',
				description: 'Authenticated user profile'
			},
			{
				name: 'Payroll',
				description: 'Workspace payroll employees and pay runs'
			},
			{
				name: 'Mailbox',
				description: 'Per-user IMAP mailbox read and SMTP send (PrivateEmail compatible)'
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
			},
			'/onboarding/access': {
				get: {
					tags: ['Workspaces'],
					summary: 'Get onboarding access state',
					description:
						'Returns whether the authenticated user needs onboarding, has a pending workspace request, or is ready for dashboard access. Used for approval polling during onboarding.',
					operationId: 'getOnboardingAccess',
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							$ref: '#/components/parameters/XRequestId'
						}
					],
					responses: {
						'200': {
							description: 'Current onboarding access state',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										required: ['data', 'meta'],
										properties: {
											data: {
												type: 'object',
												required: ['access'],
												properties: {
													access: {
														oneOf: [
															{
																type: 'object',
																required: ['status'],
																properties: {
																	status: { type: 'string', enum: ['needs_onboarding'] }
																}
															},
															{
																type: 'object',
																required: ['status', 'workspaceName', 'workspaceSlug'],
																properties: {
																	status: { type: 'string', enum: ['pending_review'] },
																	workspaceName: { type: 'string' },
																	workspaceSlug: { type: 'string' }
																}
															},
															{
																type: 'object',
																required: [
																	'status',
																	'workspaceId',
																	'workspaceName',
																	'workspaceSlug',
																	'role'
																],
																properties: {
																	status: { type: 'string', enum: ['ready'] },
																	workspaceId: { type: 'string' },
																	workspaceName: { type: 'string' },
																	workspaceSlug: { type: 'string' },
																	role: { type: 'string' }
																}
															}
														]
													}
												}
											},
											meta: { type: 'object' }
										}
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
			},
			'/users/me': {
				get: {
					tags: ['Users'],
					summary: 'Get current user profile',
					description: 'Returns the authenticated user profile for account settings screens.',
					operationId: 'getCurrentUserProfile',
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							$ref: '#/components/parameters/XRequestId'
						}
					],
					responses: {
						'200': {
							description: 'Current user profile',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										required: ['data', 'meta'],
										properties: {
											data: {
												type: 'object',
												required: ['profile'],
												properties: {
													profile: {
														$ref: '#/components/schemas/UserProfile'
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
						},
						'404': {
							description: 'User not found',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						}
					}
				},
				patch: {
					tags: ['Users'],
					summary: 'Update current user profile',
					description: 'Updates the authenticated user first and last name.',
					operationId: 'updateCurrentUserProfile',
					security: [{ bearerAuth: [] }],
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
									$ref: '#/components/schemas/UpdateProfileRequest'
								}
							}
						}
					},
					responses: {
						'200': {
							description: 'Updated user profile',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										required: ['data', 'meta'],
										properties: {
											data: {
												type: 'object',
												required: ['profile'],
												properties: {
													profile: {
														$ref: '#/components/schemas/UserProfile'
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
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						},
						'404': {
							description: 'User not found',
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
			'/users/me/presence': {
				patch: {
					tags: ['Users'],
					summary: 'Update presence status',
					description:
						'Sets the authenticated user visibility status for workspace members (online, away, busy, offline).',
					operationId: 'updateCurrentUserPresence',
					security: [{ bearerAuth: [] }],
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
									$ref: '#/components/schemas/UpdatePresenceStatusRequest'
								}
							}
						}
					},
					responses: {
						'200': {
							description: 'Updated user profile with new presence status',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										required: ['data', 'meta'],
										properties: {
											data: {
												type: 'object',
												required: ['profile'],
												properties: {
													profile: {
														$ref: '#/components/schemas/UserProfile'
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
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: {
										$ref: '#/components/schemas/ApiErrorResponse'
									}
								}
							}
						},
						'404': {
							description: 'User not found',
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
			'/users/me/presence/heartbeat': {
				post: {
					tags: ['Users'],
					summary: 'Presence heartbeat',
					description:
						'Updates last-seen timestamp while the user is active. Clients should call periodically when the app is in the foreground.',
					operationId: 'sendPresenceHeartbeat',
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							$ref: '#/components/parameters/XRequestId'
						}
					],
					responses: {
						'200': {
							description: 'Heartbeat accepted',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										required: ['data', 'meta'],
										properties: {
											data: {
												type: 'object',
												required: ['profile'],
												properties: {
													profile: {
														$ref: '#/components/schemas/UserProfile'
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
						},
						'404': {
							description: 'User not found',
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
			'/payroll/status': {
				get: {
					tags: ['Payroll'],
					summary: 'Payroll module status',
					description:
						'Returns payroll counts for the active workspace. Requires workspace owner or admin role.',
					operationId: 'getPayrollStatus',
					security: [{ bearerAuth: [] }],
					parameters: [{ $ref: '#/components/parameters/XRequestId' }],
					responses: {
						'200': {
							description: 'Payroll status for the active workspace',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PayrollStatusSuccessResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'403': {
							description: 'Payroll access required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				}
			},
			'/payroll/employees': {
				get: {
					tags: ['Payroll'],
					summary: 'List payroll employees',
					description: 'Paginated list of active employees for the active workspace.',
					operationId: 'listPayrollEmployees',
					security: [{ bearerAuth: [] }],
					parameters: [
						{ $ref: '#/components/parameters/XRequestId' },
						{
							name: 'page',
							in: 'query',
							schema: { type: 'integer', minimum: 1, default: 1 }
						},
						{
							name: 'limit',
							in: 'query',
							schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
						}
					],
					responses: {
						'200': {
							description: 'Paginated employee list',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PayrollEmployeesPaginatedResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'403': {
							description: 'Payroll access required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				},
				post: {
					tags: ['Payroll'],
					summary: 'Create payroll employee',
					description: 'Adds an active employee record for the active workspace.',
					operationId: 'createPayrollEmployee',
					security: [{ bearerAuth: [] }],
					parameters: [{ $ref: '#/components/parameters/XRequestId' }],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/PayrollEmployeeCreateRequest' }
							}
						}
					},
					responses: {
						'201': {
							description: 'Employee created',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PayrollEmployeeSuccessResponse' }
								}
							}
						},
						'400': {
							description: 'Invalid request body',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'403': {
							description: 'Payroll access required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				}
			},
			'/payroll/employees/{id}': {
				get: {
					tags: ['Payroll'],
					summary: 'Get payroll employee',
					description: 'Returns a single active employee for the active workspace.',
					operationId: 'getPayrollEmployee',
					security: [{ bearerAuth: [] }],
					parameters: [
						{ $ref: '#/components/parameters/XRequestId' },
						{
							name: 'id',
							in: 'path',
							required: true,
							schema: { type: 'string' }
						}
					],
					responses: {
						'200': {
							description: 'Employee record',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PayrollEmployeeSuccessResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'403': {
							description: 'Payroll access required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'404': {
							description: 'Employee not found',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				},
				patch: {
					tags: ['Payroll'],
					summary: 'Update payroll employee',
					description: 'Updates an active employee record for the active workspace.',
					operationId: 'updatePayrollEmployee',
					security: [{ bearerAuth: [] }],
					parameters: [
						{ $ref: '#/components/parameters/XRequestId' },
						{
							name: 'id',
							in: 'path',
							required: true,
							schema: { type: 'string' }
						}
					],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/PayrollEmployeeCreateRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Updated employee',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PayrollEmployeeSuccessResponse' }
								}
							}
						},
						'400': {
							description: 'Invalid request body',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'403': {
							description: 'Payroll access required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'404': {
							description: 'Employee not found',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				},
				delete: {
					tags: ['Payroll'],
					summary: 'Deactivate payroll employee',
					description:
						'Soft-deactivates an employee (sets isActive to false). Historical records are preserved.',
					operationId: 'deactivatePayrollEmployee',
					security: [{ bearerAuth: [] }],
					parameters: [
						{ $ref: '#/components/parameters/XRequestId' },
						{
							name: 'id',
							in: 'path',
							required: true,
							schema: { type: 'string' }
						}
					],
					responses: {
						'200': {
							description: 'Employee deactivated',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										required: ['data', 'meta'],
										properties: {
											data: {
												type: 'object',
												required: ['id', 'isActive'],
												properties: {
													id: { type: 'string' },
													isActive: { type: 'boolean', enum: [false] }
												}
											},
											meta: { $ref: '#/components/schemas/ApiMeta' }
										}
									}
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'403': {
							description: 'Payroll access required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'404': {
							description: 'Employee not found',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				}
			},
			'/payroll/settings': {
				get: {
					tags: ['Payroll'],
					summary: 'Get payroll settings',
					description: 'Returns pay schedule settings for the active workspace.',
					operationId: 'getPayrollSettings',
					security: [{ bearerAuth: [] }],
					parameters: [{ $ref: '#/components/parameters/XRequestId' }],
					responses: {
						'200': {
							description: 'Payroll settings',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PayrollSettingsSuccessResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'403': {
							description: 'Payroll access required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				},
				put: {
					tags: ['Payroll'],
					summary: 'Update payroll settings',
					description: 'Creates or updates pay schedule settings for the active workspace.',
					operationId: 'updatePayrollSettings',
					security: [{ bearerAuth: [] }],
					parameters: [{ $ref: '#/components/parameters/XRequestId' }],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/PayrollSettingsUpdateRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Updated payroll settings',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PayrollSettingsSuccessResponse' }
								}
							}
						},
						'400': {
							description: 'Invalid request body',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'403': {
							description: 'Payroll access required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				}
			},
			'/payroll/runs': {
				get: {
					tags: ['Payroll'],
					summary: 'List payroll runs',
					description: 'Paginated list of pay runs for the active workspace.',
					operationId: 'listPayrollRuns',
					security: [{ bearerAuth: [] }],
					parameters: [
						{ $ref: '#/components/parameters/XRequestId' },
						{
							name: 'page',
							in: 'query',
							schema: { type: 'integer', minimum: 1, default: 1 }
						},
						{
							name: 'limit',
							in: 'query',
							schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
						}
					],
					responses: {
						'200': {
							description: 'Paginated pay run list',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PayrollRunsPaginatedResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'403': {
							description: 'Payroll access required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				},
				post: {
					tags: ['Payroll'],
					summary: 'Create payroll run',
					description: 'Creates a draft pay run for the active workspace.',
					operationId: 'createPayrollRun',
					security: [{ bearerAuth: [] }],
					parameters: [{ $ref: '#/components/parameters/XRequestId' }],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/PayrollRunCreateRequest' }
							}
						}
					},
					responses: {
						'201': {
							description: 'Pay run created',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PayrollRunSuccessResponse' }
								}
							}
						},
						'400': {
							description: 'Invalid request body',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'403': {
							description: 'Payroll access required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				}
			},
			'/mailbox/status': {
				get: {
					tags: ['Mailbox'],
					summary: 'Mailbox connection status',
					description: 'Returns whether the current user has connected a mailbox and connection metadata.',
					operationId: 'getMailboxStatus',
					security: [{ bearerAuth: [] }],
					parameters: [{ $ref: '#/components/parameters/XRequestId' }],
					responses: {
						'200': {
							description: 'Mailbox connection status',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/MailboxStatusSuccessResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				}
			},
			'/mailbox/connect': {
				post: {
					tags: ['Mailbox'],
					summary: 'Connect or update mailbox',
					description:
						'Verifies IMAP and SMTP credentials, then stores them encrypted for the current user.',
					operationId: 'connectMailbox',
					security: [{ bearerAuth: [] }],
					parameters: [{ $ref: '#/components/parameters/XRequestId' }],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/MailboxConnectRequest' }
							}
						}
					},
					responses: {
						'201': {
							description: 'Mailbox connected',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/MailboxStatusSuccessResponse' }
								}
							}
						},
						'400': {
							description: 'Invalid body or credential verification failed',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				},
				delete: {
					tags: ['Mailbox'],
					summary: 'Disconnect mailbox',
					description: 'Removes stored mailbox credentials for the current user.',
					operationId: 'disconnectMailbox',
					security: [{ bearerAuth: [] }],
					parameters: [{ $ref: '#/components/parameters/XRequestId' }],
					responses: {
						'200': {
							description: 'Mailbox disconnected',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										required: ['data', 'meta'],
										properties: {
											data: {
												type: 'object',
												required: ['connected'],
												properties: {
													connected: { type: 'boolean', const: false }
												}
											},
											meta: { $ref: '#/components/schemas/ApiMeta' }
										}
									}
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				}
			},
			'/mailbox/folders': {
				get: {
					tags: ['Mailbox'],
					summary: 'List IMAP folders',
					description: 'Lists folders from the connected mailbox.',
					operationId: 'listMailboxFolders',
					security: [{ bearerAuth: [] }],
					parameters: [{ $ref: '#/components/parameters/XRequestId' }],
					responses: {
						'200': {
							description: 'Folder list',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/MailboxFoldersSuccessResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'503': {
							description: 'Mailbox not connected',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				},
				post: {
					tags: ['Mailbox'],
					summary: 'Verify mailbox connection',
					description: 'Re-verifies IMAP connectivity for the connected mailbox.',
					operationId: 'verifyMailboxConnection',
					security: [{ bearerAuth: [] }],
					parameters: [{ $ref: '#/components/parameters/XRequestId' }],
					responses: {
						'200': {
							description: 'Verification result',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										required: ['data', 'meta'],
										properties: {
											data: {
												type: 'object',
												required: ['ok'],
												properties: {
													ok: { type: 'boolean' },
													message: { type: 'string' }
												}
											},
											meta: { $ref: '#/components/schemas/ApiMeta' }
										}
									}
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'503': {
							description: 'Mailbox not connected or verification failed',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				}
			},
			'/mailbox/folder-page': {
				get: {
					tags: ['Mailbox'],
					summary: 'Load folder list and message page together',
					description:
						'Returns IMAP folders and a paginated message list for one folder in a single connection.',
					operationId: 'getMailboxFolderPage',
					security: [{ bearerAuth: [] }],
					parameters: [
						{ $ref: '#/components/parameters/XRequestId' },
						{
							name: 'folder',
							in: 'query',
							schema: { type: 'string', default: 'INBOX' }
						},
						{
							name: 'page',
							in: 'query',
							schema: { type: 'integer', minimum: 1, default: 1 }
						},
						{
							name: 'limit',
							in: 'query',
							schema: { type: 'integer', minimum: 1, maximum: 100, default: 25 }
						},
						{
							name: 'q',
							in: 'query',
							required: false,
							description:
								'IMAP TEXT search across message headers and body (RFC 3501 / PrivateEmail).',
							schema: { type: 'string', maxLength: 200 }
						}
					],
					responses: {
						'200': {
							description: 'Folders and messages',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										required: ['data', 'meta'],
										properties: {
											data: {
												type: 'object',
												required: ['folders', 'messages', 'pagination'],
												properties: {
													folders: {
														type: 'array',
														items: { $ref: '#/components/schemas/MailboxFolder' }
													},
													messages: {
														type: 'array',
														items: { $ref: '#/components/schemas/MailboxMessageSummary' }
													},
													pagination: {
														type: 'object',
														required: ['page', 'limit', 'total', 'hasMore'],
														properties: {
															page: { type: 'integer' },
															limit: { type: 'integer' },
															total: { type: 'integer' },
															hasMore: { type: 'boolean' }
														}
													}
												}
											},
											meta: { $ref: '#/components/schemas/ApiMeta' }
										}
									}
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'503': {
							description: 'Mailbox not connected',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				}
			},
			'/mailbox/messages': {
				get: {
					tags: ['Mailbox'],
					summary: 'List mailbox messages',
					description: 'Paginated message summaries for a folder.',
					operationId: 'listMailboxMessages',
					security: [{ bearerAuth: [] }],
					parameters: [
						{ $ref: '#/components/parameters/XRequestId' },
						{
							name: 'folder',
							in: 'query',
							required: false,
							schema: { type: 'string', default: 'INBOX' }
						},
						{
							name: 'page',
							in: 'query',
							required: false,
							schema: { type: 'integer', minimum: 1, default: 1 }
						},
						{
							name: 'limit',
							in: 'query',
							required: false,
							schema: { type: 'integer', minimum: 1, maximum: 100, default: 25 }
						},
						{
							name: 'q',
							in: 'query',
							required: false,
							description:
								'IMAP TEXT search across message headers and body (RFC 3501 / PrivateEmail).',
							schema: { type: 'string', maxLength: 200 }
						}
					],
					responses: {
						'200': {
							description: 'Paginated message list',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/MailboxMessagesPaginatedResponse' }
								}
							}
						},
						'400': {
							description: 'Invalid query parameters',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'503': {
							description: 'Mailbox not connected',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				}
			},
			'/mailbox/messages/{uid}': {
				get: {
					tags: ['Mailbox'],
					summary: 'Get mailbox message',
					description: 'Full message detail for a folder UID.',
					operationId: 'getMailboxMessage',
					security: [{ bearerAuth: [] }],
					parameters: [
						{ $ref: '#/components/parameters/XRequestId' },
						{
							name: 'uid',
							in: 'path',
							required: true,
							schema: { type: 'integer', minimum: 1 }
						},
						{
							name: 'folder',
							in: 'query',
							required: true,
							schema: { type: 'string' }
						},
						{
							name: 'markSeen',
							in: 'query',
							required: false,
							description:
								'When true, sets the IMAP \\Seen flag. Use when the user opens a message, not for prefetch.',
							schema: { type: 'boolean', default: false }
						}
					],
					responses: {
						'200': {
							description: 'Message detail',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/MailboxMessageDetailSuccessResponse' }
								}
							}
						},
						'400': {
							description: 'Invalid parameters',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'404': {
							description: 'Message not found',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'503': {
							description: 'Mailbox not connected',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				},
				patch: {
					tags: ['Mailbox'],
					summary: 'Update mailbox message',
					description: 'Toggle read/flagged state or move a message to archive, trash, or spam.',
					operationId: 'patchMailboxMessage',
					security: [{ bearerAuth: [] }],
					parameters: [
						{ $ref: '#/components/parameters/XRequestId' },
						{
							name: 'uid',
							in: 'path',
							required: true,
							schema: { type: 'integer', minimum: 1 }
						}
					],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/MailboxMessageActionRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Message updated or moved',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/MailboxMessageActionSuccessResponse' }
								}
							}
						},
						'400': {
							description: 'Invalid parameters',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'404': {
							description: 'Message not found',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'503': {
							description: 'Mailbox not connected',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						}
					}
				}
			},
			'/mailbox/send': {
				post: {
					tags: ['Mailbox'],
					summary: 'Send mailbox message',
					description: 'Sends email via the connected user SMTP account.',
					operationId: 'sendMailboxMessage',
					security: [{ bearerAuth: [] }],
					parameters: [{ $ref: '#/components/parameters/XRequestId' }],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/MailboxSendMessageRequest' }
							}
						}
					},
					responses: {
						'201': {
							description: 'Message sent',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/MailboxSendSuccessResponse' }
								}
							}
						},
						'400': {
							description: 'Invalid request body',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'401': {
							description: 'Authentication required',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
								}
							}
						},
						'503': {
							description: 'Mailbox not connected',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/ApiErrorResponse' }
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
				UserProfile: {
					type: 'object',
					required: [
						'id',
						'email',
						'firstName',
						'lastName',
						'avatarUrl',
						'phoneNumber',
						'phoneVerified',
						'emailVerified',
						'hasGoogleAccount',
						'presenceStatus',
						'lastSeenAt',
						'createdAt'
					],
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
						avatarUrl: {
							type: ['string', 'null'],
							format: 'uri',
							description: 'Profile image URL when available'
						},
						phoneNumber: {
							type: ['string', 'null'],
							description: 'E.164 mobile number when set'
						},
						phoneVerified: {
							type: 'boolean',
							description: 'Whether the mobile number has been verified'
						},
						emailVerified: {
							type: 'boolean'
						},
						hasGoogleAccount: {
							type: 'boolean',
							description: 'Whether Google sign-in is linked'
						},
						presenceStatus: {
							type: 'string',
							enum: ['online', 'away', 'busy', 'offline'],
							description: 'Effective presence status visible to workspace members'
						},
						lastSeenAt: {
							type: ['string', 'null'],
							format: 'date-time',
							description: 'Last heartbeat timestamp when not offline'
						},
						createdAt: {
							type: 'string',
							format: 'date-time'
						}
					}
				},
				UpdateProfileRequest: {
					type: 'object',
					required: ['firstName', 'lastName'],
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
						}
					}
				},
				UpdatePresenceStatusRequest: {
					type: 'object',
					required: ['status'],
					properties: {
						status: {
							type: 'string',
							enum: ['online', 'away', 'busy', 'offline'],
							example: 'online'
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
				},
				PayrollSettings: {
					type: 'object',
					required: [
						'workspaceId',
						'payFrequency',
						'timezone',
						'currency',
						'weekStartDay',
						'periodAnchorDate',
						'configured',
						'updatedAt'
					],
					properties: {
						workspaceId: { type: 'string' },
						payFrequency: {
							type: 'string',
							enum: ['weekly', 'bi-weekly', 'semi-monthly', 'monthly']
						},
						timezone: {
							type: 'string',
							enum: [
								'Asia/Manila',
								'UTC',
								'Asia/Singapore',
								'Asia/Tokyo',
								'Asia/Hong_Kong',
								'Asia/Seoul',
								'Asia/Kolkata',
								'Asia/Dubai',
								'Europe/London',
								'Europe/Paris',
								'Europe/Berlin',
								'America/New_York',
								'America/Chicago',
								'America/Denver',
								'America/Los_Angeles',
								'America/Toronto',
								'America/Vancouver',
								'Australia/Sydney',
								'Pacific/Auckland'
							]
						},
						currency: {
							type: 'string',
							enum: ['PHP', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'HKD', 'JPY', 'INR', 'AED', 'NZD']
						},
						weekStartDay: {
							type: 'string',
							nullable: true,
							enum: [
								'sunday',
								'monday',
								'tuesday',
								'wednesday',
								'thursday',
								'friday',
								'saturday',
								null
							]
						},
						periodAnchorDate: { type: 'string', format: 'date', nullable: true },
						configured: { type: 'boolean' },
						updatedAt: { type: 'string', format: 'date-time', nullable: true }
					}
				},
				PayrollSettingsUpdateRequest: {
					type: 'object',
					required: ['payFrequency', 'timezone', 'currency'],
					properties: {
						payFrequency: {
							type: 'string',
							enum: ['weekly', 'bi-weekly', 'semi-monthly', 'monthly']
						},
						timezone: {
							type: 'string',
							enum: [
								'Asia/Manila',
								'UTC',
								'Asia/Singapore',
								'Asia/Tokyo',
								'Asia/Hong_Kong',
								'Asia/Seoul',
								'Asia/Kolkata',
								'Asia/Dubai',
								'Europe/London',
								'Europe/Paris',
								'Europe/Berlin',
								'America/New_York',
								'America/Chicago',
								'America/Denver',
								'America/Los_Angeles',
								'America/Toronto',
								'America/Vancouver',
								'Australia/Sydney',
								'Pacific/Auckland'
							]
						},
						currency: {
							type: 'string',
							enum: ['PHP', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'HKD', 'JPY', 'INR', 'AED', 'NZD']
						},
						weekStartDay: {
							type: 'string',
							enum: [
								'sunday',
								'monday',
								'tuesday',
								'wednesday',
								'thursday',
								'friday',
								'saturday'
							]
						},
						periodAnchorDate: { type: 'string', format: 'date' }
					}
				},
				PayrollSettingsSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: { $ref: '#/components/schemas/PayrollSettings' },
						meta: { $ref: '#/components/schemas/ApiMeta' }
					}
				},
				PayrollStatus: {
					type: 'object',
					required: ['enabled', 'workspaceId', 'runCount', 'employeeCount'],
					properties: {
						enabled: { type: 'boolean' },
						workspaceId: { type: 'string' },
						runCount: { type: 'integer', minimum: 0 },
						employeeCount: { type: 'integer', minimum: 0 }
					}
				},
				PayrollStatusSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: { $ref: '#/components/schemas/PayrollStatus' },
						meta: { $ref: '#/components/schemas/ApiMeta' }
					}
				},
				PayrollEmployee: {
					type: 'object',
					required: [
						'id',
						'workspaceId',
						'firstName',
						'lastName',
						'fullName',
						'payType',
						'payRateCents',
						'isActive',
						'createdAt',
						'updatedAt'
					],
					properties: {
						id: { type: 'string' },
						workspaceId: { type: 'string' },
						firstName: { type: 'string' },
						lastName: { type: 'string' },
						fullName: { type: 'string' },
						email: { type: 'string', format: 'email', nullable: true },
						jobTitle: { type: 'string', nullable: true },
						payType: { type: 'string', enum: ['hourly', 'monthly'] },
						payRateCents: { type: 'integer', minimum: 0 },
						isActive: { type: 'boolean' },
						createdAt: { type: 'string', format: 'date-time' },
						updatedAt: { type: 'string', format: 'date-time' }
					}
				},
				PayrollEmployeeCreateRequest: {
					type: 'object',
					required: ['firstName', 'lastName', 'payType', 'payRate'],
					properties: {
						firstName: { type: 'string', maxLength: 80 },
						lastName: { type: 'string', maxLength: 80 },
						email: { type: 'string', format: 'email' },
						jobTitle: { type: 'string', maxLength: 120 },
						payType: { type: 'string', enum: ['hourly', 'monthly'] },
						payRate: { type: 'number', minimum: 0 }
					}
				},
				PayrollEmployeeSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: { $ref: '#/components/schemas/PayrollEmployee' },
						meta: { $ref: '#/components/schemas/ApiMeta' }
					}
				},
				PayrollEmployeesPaginatedResponse: {
					type: 'object',
					required: ['data', 'pagination', 'meta'],
					properties: {
						data: {
							type: 'array',
							items: { $ref: '#/components/schemas/PayrollEmployee' }
						},
						pagination: { $ref: '#/components/schemas/PaginationMeta' },
						meta: { $ref: '#/components/schemas/ApiMeta' }
					}
				},
				PayrollRun: {
					type: 'object',
					required: [
						'id',
						'workspaceId',
						'title',
						'periodStart',
						'periodEnd',
						'status',
						'createdAt',
						'updatedAt'
					],
					properties: {
						id: { type: 'string' },
						workspaceId: { type: 'string' },
						title: { type: 'string' },
						periodStart: { type: 'string', format: 'date-time' },
						periodEnd: { type: 'string', format: 'date-time' },
						status: {
							type: 'string',
							enum: ['draft', 'processing', 'completed', 'failed']
						},
						createdAt: { type: 'string', format: 'date-time' },
						updatedAt: { type: 'string', format: 'date-time' }
					}
				},
				PayrollRunCreateRequest: {
					type: 'object',
					required: ['title', 'periodStart', 'periodEnd'],
					properties: {
						title: { type: 'string', maxLength: 120 },
						periodStart: { type: 'string', format: 'date', example: '2026-01-01' },
						periodEnd: { type: 'string', format: 'date', example: '2026-01-15' }
					}
				},
				PayrollRunSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: { $ref: '#/components/schemas/PayrollRun' },
						meta: { $ref: '#/components/schemas/ApiMeta' }
					}
				},
				PayrollRunsPaginatedResponse: {
					type: 'object',
					required: ['data', 'pagination', 'meta'],
					properties: {
						data: {
							type: 'array',
							items: { $ref: '#/components/schemas/PayrollRun' }
						},
						pagination: { $ref: '#/components/schemas/PaginationMeta' },
						meta: { $ref: '#/components/schemas/ApiMeta' }
					}
				},
				MailboxConnectionStatus: {
					type: 'object',
					required: ['connected'],
					properties: {
						connected: { type: 'boolean' },
						email: { type: 'string', format: 'email' },
						displayName: { type: 'string' },
						connectedAt: { type: 'string', format: 'date-time' },
						lastVerifiedAt: { type: 'string', format: 'date-time' }
					}
				},
				MailboxStatusSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: { $ref: '#/components/schemas/MailboxConnectionStatus' },
						meta: { $ref: '#/components/schemas/ApiMeta' }
					}
				},
				MailboxConnectRequest: {
					type: 'object',
					required: ['email', 'password'],
					properties: {
						email: { type: 'string', format: 'email' },
						password: { type: 'string', format: 'password' },
						displayName: { type: 'string', maxLength: 120 },
						imapHost: { type: 'string' },
						imapPort: { type: 'integer', minimum: 1, maximum: 65535 },
						imapSecure: { type: 'boolean' },
						smtpHost: { type: 'string' },
						smtpPort: { type: 'integer', minimum: 1, maximum: 65535 },
						smtpSecure: { type: 'boolean' }
					}
				},
				MailboxFolder: {
					type: 'object',
					required: ['path', 'name', 'specialUse', 'unseen', 'total'],
					properties: {
						path: { type: 'string' },
						name: { type: 'string' },
						specialUse: { type: 'string', nullable: true },
						unseen: { type: 'integer' },
						total: { type: 'integer' }
					}
				},
				MailboxFoldersSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: {
							type: 'object',
							required: ['folders'],
							properties: {
								folders: {
									type: 'array',
									items: { $ref: '#/components/schemas/MailboxFolder' }
								}
							}
						},
						meta: { $ref: '#/components/schemas/ApiMeta' }
					}
				},
				MailboxMessageSummary: {
					type: 'object',
					required: [
						'uid',
						'subject',
						'from',
						'to',
						'date',
						'seen',
						'answered',
						'flagged',
						'hasAttachments',
						'preview'
					],
					properties: {
						uid: { type: 'integer' },
						subject: { type: 'string' },
						from: { type: 'string' },
						to: { type: 'array', items: { type: 'string' } },
						date: { type: 'string', format: 'date-time' },
						seen: { type: 'boolean' },
						answered: { type: 'boolean' },
						flagged: { type: 'boolean' },
						hasAttachments: { type: 'boolean' },
						preview: { type: 'string' }
					}
				},
				MailboxMessageDetail: {
					allOf: [
						{ $ref: '#/components/schemas/MailboxMessageSummary' },
						{
							type: 'object',
							required: ['cc', 'bcc', 'messageId', 'inReplyTo', 'text', 'html'],
							properties: {
								cc: { type: 'array', items: { type: 'string' } },
								bcc: { type: 'array', items: { type: 'string' } },
								messageId: { type: 'string', nullable: true },
								inReplyTo: { type: 'string', nullable: true },
								text: { type: 'string' },
								html: { type: 'string', nullable: true }
							}
						}
					]
				},
				MailboxMessageDetailSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: { $ref: '#/components/schemas/MailboxMessageDetail' },
						meta: { $ref: '#/components/schemas/ApiMeta' }
					}
				},
				MailboxMessageActionRequest: {
					type: 'object',
					required: ['folder', 'action'],
					properties: {
						folder: { type: 'string' },
						action: {
							type: 'string',
							enum: ['toggleRead', 'toggleFlagged', 'archive', 'delete', 'spam']
						}
					}
				},
				MailboxMessageActionSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: {
							oneOf: [
								{
									type: 'object',
									required: ['type', 'seen', 'flagged'],
									properties: {
										type: { type: 'string', enum: ['updated'] },
										seen: { type: 'boolean' },
										flagged: { type: 'boolean' }
									}
								},
								{
									type: 'object',
									required: ['type'],
									properties: {
										type: { type: 'string', enum: ['moved'] }
									}
								}
							]
						},
						meta: { $ref: '#/components/schemas/ApiMeta' }
					}
				},
				MailboxMessagesPaginatedResponse: {
					type: 'object',
					required: ['data', 'pagination', 'meta'],
					properties: {
						data: {
							type: 'array',
							items: { $ref: '#/components/schemas/MailboxMessageSummary' }
						},
						pagination: {
							type: 'object',
							required: ['page', 'limit', 'total', 'hasMore'],
							properties: {
								page: { type: 'integer' },
								limit: { type: 'integer' },
								total: { type: 'integer' },
								hasMore: { type: 'boolean' }
							}
						},
						meta: { $ref: '#/components/schemas/ApiMeta' }
					}
				},
				MailboxSendMessageRequest: {
					type: 'object',
					required: ['to', 'subject', 'text'],
					properties: {
						to: {
							type: 'array',
							items: { type: 'string', format: 'email' },
							minItems: 1,
							maxItems: 50
						},
						cc: {
							type: 'array',
							items: { type: 'string', format: 'email' },
							maxItems: 50
						},
						bcc: {
							type: 'array',
							items: { type: 'string', format: 'email' },
							maxItems: 50
						},
						subject: { type: 'string', maxLength: 998 },
						text: { type: 'string', maxLength: 100000 },
						html: { type: 'string', maxLength: 200000 },
						replyTo: { type: 'string', format: 'email' }
					}
				},
				MailboxSendSuccessResponse: {
					type: 'object',
					required: ['data', 'meta'],
					properties: {
						data: {
							type: 'object',
							required: ['messageId'],
							properties: {
								messageId: { type: 'string', nullable: true }
							}
						},
						meta: { $ref: '#/components/schemas/ApiMeta' }
					}
				}
			}
		}
	};
}
