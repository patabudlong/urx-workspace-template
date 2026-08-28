import { addIcon } from 'iconify-icon';
import activityLinear from '@iconify-icons/solar/pulse-2-linear';
import arrowRightLinear from '@iconify-icons/solar/arrow-right-linear';
import bookBookmarkLinear from '@iconify-icons/solar/book-bookmark-linear';
import calendarLinear from '@iconify-icons/solar/calendar-linear';
import calendarDateLinear from '@iconify-icons/solar/calendar-date-linear';
import calendarMarkLinear from '@iconify-icons/solar/calendar-mark-linear';
import calculatorMinimalisticLinear from '@iconify-icons/solar/calculator-minimalistic-linear';
import handshakeLinear from '@iconify-icons/lucide/handshake';
import clipboardListLinear from '@iconify-icons/solar/clipboard-list-linear';
import cardLinear from '@iconify-icons/solar/card-linear';
import caseLinear from '@iconify-icons/solar/case-linear';
import chatRoundCallLinear from '@iconify-icons/solar/chat-round-call-linear';
import clockCircleLinear from '@iconify-icons/solar/clock-circle-linear';
import devicesLinear from '@iconify-icons/solar/devices-linear';
import documentTextLinear from '@iconify-icons/solar/document-text-linear';
import fingerprintLinear from '@iconify-icons/lucide/fingerprint';
import historyLinear from '@iconify-icons/solar/history-linear';
import homeSmileLinear from '@iconify-icons/solar/home-smile-linear';
import keyLinear from '@iconify-icons/solar/key-linear';
import layersLinear from '@iconify-icons/solar/layers-linear';
import letterLinear from '@iconify-icons/solar/letter-linear';
import mailboxLinear from '@iconify-icons/solar/mailbox-linear';
import magniferLinear from '@iconify-icons/solar/magnifer-linear';
import minusCircleLinear from '@iconify-icons/solar/minus-circle-linear';
import penLinear from '@iconify-icons/solar/pen-linear';
import qrCodeLinear from '@iconify-icons/solar/qr-code-linear';
import recordCircleLinear from '@iconify-icons/solar/record-circle-linear';
import settingsLinear from '@iconify-icons/solar/settings-linear';
import shieldCheckLinear from '@iconify-icons/solar/shield-check-linear';
import shieldCrossLinear from '@iconify-icons/solar/shield-cross-linear';
import shieldUserLinear from '@iconify-icons/solar/shield-user-linear';
import trashBinTrashLinear from '@iconify-icons/solar/trash-bin-trash-linear';
import uploadLinear from '@iconify-icons/solar/upload-linear';
import userCircleLinear from '@iconify-icons/solar/user-circle-linear';
import userIdLinear from '@iconify-icons/solar/user-id-linear';
import userPlusLinear from '@iconify-icons/solar/user-plus-linear';
import usersGroupRoundedLinear from '@iconify-icons/solar/users-group-rounded-linear';
import walletMoneyLinear from '@iconify-icons/solar/wallet-money-linear';
import widget2Linear from '@iconify-icons/solar/widget-2-linear';
import widget5Linear from '@iconify-icons/solar/widget-5-linear';

const registry: [string, typeof widget2Linear][] = [
	['solar:widget-2-linear', widget2Linear],
	['solar:users-group-rounded-linear', usersGroupRoundedLinear],
	['solar:letter-linear', letterLinear],
	['solar:wallet-money-linear', walletMoneyLinear],
	['solar:clock-circle-linear', clockCircleLinear],
	['lucide:fingerprint', fingerprintLinear],
	['solar:book-bookmark-linear', bookBookmarkLinear],
	['solar:pulse-2-linear', activityLinear],
	['solar:user-circle-linear', userCircleLinear],
	['solar:shield-check-linear', shieldCheckLinear],
	['solar:shield-cross-linear', shieldCrossLinear],
	['solar:shield-user-linear', shieldUserLinear],
	['solar:chat-round-call-linear', chatRoundCallLinear],
	['solar:devices-linear', devicesLinear],
	['solar:qr-code-linear', qrCodeLinear],
	['solar:trash-bin-trash-linear', trashBinTrashLinear],
	['solar:card-linear', cardLinear],
	['solar:home-smile-linear', homeSmileLinear],
	['solar:mailbox-linear', mailboxLinear],
	['solar:key-linear', keyLinear],
	['solar:settings-linear', settingsLinear],
	['solar:user-id-linear', userIdLinear],
	['solar:calendar-linear', calendarLinear],
	['solar:document-text-linear', documentTextLinear],
	['solar:history-linear', historyLinear],
	['solar:upload-linear', uploadLinear],
	['solar:case-linear', caseLinear],
	['solar:minus-circle-linear', minusCircleLinear],
	['solar:calendar-mark-linear', calendarMarkLinear],
	['solar:calendar-date-linear', calendarDateLinear],
	['solar:pen-linear', penLinear],
	['solar:widget-5-linear', widget5Linear],
	['solar:record-circle-linear', recordCircleLinear],
	['solar:layers-linear', layersLinear],
	['solar:user-plus-linear', userPlusLinear],
	['solar:arrow-right-linear', arrowRightLinear],
	['solar:magnifer-linear', magniferLinear],
// urixoft-workspace-accounting:icon-registry:start
	['solar:calculator-minimalistic-linear', calculatorMinimalisticLinear],
// urixoft-workspace-crm:icon-registry:start
	['lucide:handshake', handshakeLinear],
// urixoft-workspace-crm:icon-registry:end
// urx-project_management-package:icon-registry:start
	['solar:clipboard-list-linear', clipboardListLinear]
// urx-project_management-package:icon-registry:end
// urixoft-workspace-accounting:icon-registry:end
];

for (const [name, data] of registry) {
	addIcon(name, data);
}
