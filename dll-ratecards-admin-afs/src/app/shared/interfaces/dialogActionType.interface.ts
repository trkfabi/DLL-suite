/**
 * @class IDialogActionType
 * @abstract
 * @property { String } IDialogActionType.action The action to execute on dialogs submission.
 * @property { String } IDialogActionType.type The type of data to process on dialogs.
 * @version 1.0.0
 */
export interface IDialogActionType {
	action: string;
	type: string;
}
