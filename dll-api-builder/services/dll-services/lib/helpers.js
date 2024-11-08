/**
 * @class Helpers
 * Utility class
 * ##version 1.0.0
 */

const helpers = (function () {
	/**
	 * @method uuid
	 * Generates a UUID string.
	 * @returns {String} The generated UUID.
	 */
	const uuid = () => {
		const p8 = (s) => {
			var p = (Math.random().toString(16) + '000000000').substr(2, 8);
			return s ? '-' + p.substr(0, 4) + '-' + p.substr(4, 4) : p;
		};
		return p8() + p8(true) + p8(true) + p8();
	};

	/**
	 * @method getWsdlRequestor
	 * Returns WSDL Requestor object
	 * @param username {String} The websso username
	 * @param group {String} The group
	 * @returns {Object} The generated Requestor object.
	 */
	const getWsdlRequestor = (username, group) => ({
		UserIdentity: username,
		UserClass: group,
		RequestId: uuid()
	});

	return {
		getWsdlRequestor: getWsdlRequestor
	};
})();

module.exports = helpers;
