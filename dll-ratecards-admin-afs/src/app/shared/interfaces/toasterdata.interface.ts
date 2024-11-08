/**
 * @class ToasterData
 * @abstract
 * The Toaster Data to display on toast.pop event.
 * ToasterData `Interface`
 * @property {String} ToasterData.type stores the toaster type to display, options available `success, info, error, warning`.
 * @property {String} ToasterData.event stores the event initializer name of toaster.
 * This allow to the `ToasterEventHandlerService` to identify when is a new toaster or button click.
 * @property {String} ToasterData.message message to display on Toaster Notification.
 * @property {Boolean} ToasterData.hasButtons display/hide buttons to save or cancel actions.
 * @property {Boolean} ToasterData.hasIcons display/hide the Icons on the template.
 * @property {String} ToasterData.saveButtonText Add text to the `saveButton`
 * @property {String} ToasterData.cancelButtonText Add text to the `cancelButton`
 * @version 1.0.0
 */
export interface IToasterData {
	type: string;
	event: string;
	message: string;
	hasButtons: boolean;
	hasIcon: boolean;
	saveButtonText: string;
	cancelButtonText: string;
}
