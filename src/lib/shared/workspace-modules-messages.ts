export const WORKSPACE_MODULES_UPDATED_MESSAGE = 'Workspace modules updated.';
export const WORKSPACE_MODULES_UPDATE_FAILED_MESSAGE = 'Unable to update workspace modules.';
export const WORKSPACE_MODULES_UPDATE_FORBIDDEN_MESSAGE =
	'Only workspace owners can manage modules.';
export const WORKSPACE_MODULES_INVALID_SELECTION_MESSAGE = 'Invalid module selection.';

export const WORKSPACE_MODULE_TRIAL_DAYS = 30;
export const WORKSPACE_MODULE_DATA_RETENTION_DAYS = 3;

export const WORKSPACE_MODULE_TRIAL_NOTICE_TITLE = 'Trial & data retention';
export const WORKSPACE_MODULE_TRIAL_NOTICE_DESCRIPTION = `Enabling this module starts a ${WORKSPACE_MODULE_TRIAL_DAYS}-day trial for your workspace. If the trial ends or you disable the module without upgrading, access stops immediately and module data is kept for ${WORKSPACE_MODULE_DATA_RETENTION_DAYS} more days so you can export records or re-enable the module. After that grace period, all module data is permanently deleted.`;

export const WORKSPACE_MODULE_INTEGRATION_SETTINGS_SAVED_MESSAGE =
	'Your integration credentials have been saved for this workspace module.';
export const WORKSPACE_MODULE_INTEGRATION_SETTINGS_SAVE_FAILED_MESSAGE =
	'Unable to save integration credentials.';
export const WORKSPACE_MODULE_INTEGRATION_SETTINGS_LOAD_FAILED_MESSAGE =
	'Unable to load integration credentials.';
export const WORKSPACE_MODULE_INTEGRATION_CREDENTIALS_GENERATED_MESSAGE =
	'New client credentials were generated. Copy the client secret now — it will not be shown again.';
export const WORKSPACE_MODULE_INTEGRATION_CREDENTIALS_GENERATE_FAILED_MESSAGE =
	'Unable to generate integration credentials.';
export const WORKSPACE_MODULE_INTEGRATION_CREDENTIALS_REGENERATE_CONFIRM_MESSAGE =
	'Generate new credentials? This will invalidate the current client secret immediately.';
