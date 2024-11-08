/**
 * Utilities for encrypting, nothing self-made
 * @class Utils.crypto
 * @singleton
 */
const aesjs = require('aes-js');
const jwt = require('jsonwebtoken');

// const LOG_TAG = '\x1b[35m' + '[lib/crypto]' + '\x1b[39;49m ';

const Crypto = (function () {
	// +-------------------
	// | Private members.
	// +-------------------
	let authKey = null;
	let authIV = null;

	/**
	 * @method padBytesIn
	 * @private
	 * Adds missing bytes to the array to ensure it's multiple of 16
	 * @param {string} string String to add bytes ins
	 * @return {string}
	 */
	const padBytesIn = (string) => {
		const {
			length
		} = string;
		const padByte = 16 - (length % 16);
		for (let i = 0; i < padByte; i++) {
			string += String.fromCharCode(padByte);
		}

		return string;
	};

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method init
	 * Starts the singleton with server configs
	 * @param {object} server Server instance
	 * @return {void}
	 */
	const init = (server) => {
		const {
			config: {
				authKey: key,
				authIV: iv
			}
		} = server;

		authKey = key;
		authIV = iv;
	};

	/**
	 * @method encrypt
	 * @private
	 * Encrypts the password according to DLL requirements
	 * @param {string} pass='' Text to encrypt
	 * @return {string}
	 */
	const encrypt = (pass = '') => {
		const rujWEIsL = aesjs.utils.hex.toBytes(authKey);
		const rIWKRllsW = aesjs.utils.hex.toBytes(authIV);

		pass = padBytesIn(pass);

		const passBytes = aesjs.utils.utf8.toBytes(pass);
		const aesCbc = new aesjs.ModeOfOperation.cbc(rujWEIsL, rIWKRllsW);
		const encryptedBytes = aesCbc.encrypt(passBytes);
		const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes).toUpperCase();

		return encryptedHex;
	};

	/**
	 * @method generateToken
	 * @private
	 * Using JWT, generates a new token based on a valid response from DLL
	 * @param {object} dllResponse Response json from DLL SOAP call (in JSON)
	 * @return {string}
	 */
	const generateToken = (payload, options = {}) => {
		return jwt.sign(payload, authKey, options);
	};

	const validateToken = (token, options = {}) => {
		try {
			return jwt.verify(token, authKey, options);
		} catch (error) {
			return {
				error
			};
		}
	};

	return {
		init,
		encrypt,
		generateToken,
		validateToken
	};
})();

module.exports = Crypto;
