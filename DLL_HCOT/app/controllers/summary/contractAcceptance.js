/**
 * @class Controllers.summary.contractAcceptance
 * Shows the status of the authorizations (Signature, SSN, DOB, etc.)
 */

var args = arguments[0] || {};
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');

var customer;
var quote;

var authorizations = [];
var authorizationRows = {};

/**
 * @method init
 * @private
 * Initializes the Equipment Information Controller
 * @return {void}
 */
function init() {
	doLog && console.log('[contractAcceptance] - init');

	authorizations = args.authorizations || [];
	quote = args.quote;
	customer = quote.get('customer');

	$.sectionHeader.setTitle(L(args.titleid));

	$.legalNameTextField.value = stringFormatter.restoreSingleQuote(customer.getLegalName());

	_.each(authorizations, function (_authorization) {
		var authorizationRow = {
			container: $.UI.create('View', {
				classes: 'purchaseRow'
			}),
			title: $.UI.create('Label', {
				classes: 'purchaseOptionLabel',
				text: L(_authorization.summaryTitleid)
			}),
			checkmark: $.UI.create('ImageView', {
				classes: 'purchaseOptionCheck'
			})
		};

		authorizationRow.container.add(authorizationRow.title);
		authorizationRow.container.add(authorizationRow.checkmark);

		authorizationRows[_authorization.id] = authorizationRow;

		$.setCheckmarkActive(_authorization.id, _authorization.hasData);

		$.container.add(authorizationRow.container);
	});
};

/**
 * @method setCheckmarkActive
 * Actives/Desactivates a row checkmark for an authorization row
 * @param {String} _rowID Row's name to set (See `<config-file>.summary.authorizations.id`).
 * @param {Boolean} _state `true` if the checkmark should appear, `false` otherwise.
 * @return {void}
 */
$.setCheckmarkActive = function (_rowID, _state) {
	doLog && console.log('[contractAcceptance] - setCheckmarkActive() - ' + _rowID);
	if (_rowID) {
		var authorizationRow = authorizationRows[_rowID];

		if (authorizationRow) {
			authorizationRow.checkmark.image = _state ? authorizationRow.checkmark.imageActive : authorizationRow.checkmark.imageInactive;
		}
	}
};

/**
 * @method blurFields
 * Forces the `blur` event in the textfield
 * @return {void}
 */
$.blurFields = function () {
	doLog && console.log('[contractAcceptance] - blurFields()');

	$.legalNameTextField.blur();
};

/**
 * @method handleSectionHeaderClick
 * @private
 * Handles the section header click event
 * @return {void}
 */
function handleSectionHeaderClick() {
	uiHelpers.expandCollapse({
		container: $.contractAcceptance,
		button: $.sectionHeader.expandColapseButton
	});
};

/**
 * @method handleLegalNameChange
 * @private
 * Handles the legalNameTextField change event to update customer model
 * @param {Object} _evt Change event object
 * @return {void}
 */
function handleLegalNameChange(_evt) {
	var newLegalName = $.legalNameTextField.value;
	if (OS_IOS && newLegalName.length > 0) {
		var cursorLocation = _evt.source.selection ? _evt.source.selection.location : 0;
		var newLegalNameCopy = newLegalName;
		newLegalName = uiHelpers.replaceQuotes(newLegalName);
		if (newLegalName != newLegalNameCopy) {
			_evt.source.value = newLegalName;
			_evt.source.selection && _evt.source.setSelection(cursorLocation, cursorLocation);
		}
	}
	customer
		.set({
			'legalName': newLegalName,
			'hasLegalName': (+!!(newLegalName))
		})
		.save();
};

$.sectionHeader.addEventListener('click', handleSectionHeaderClick);
$.legalNameTextField.addEventListener('change', handleLegalNameChange);

init();
