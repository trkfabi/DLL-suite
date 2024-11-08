const fs = require('fs');
const moment = require('moment');
const today = moment();

const FileUtils = (function () {
	let filenameLog = '';
	let verbose = false;
	let saveLogs = false;

	const checkFileExists = (_filename, _unlink = true) => {
		if (_filename.indexOf('/') > 0) {
			const folder = _filename.substring(0, _filename.indexOf('/') + 1);
			if (!fs.existsSync(folder)) {
				fs.mkdirSync(folder);
			}
		}
		if (fs.existsSync(_filename) && _unlink) {
			fs.unlinkSync(_filename);
		}
	};

	const appendFileSync = (_filename, _text) => {
		_filename && fs.appendFileSync(_filename, _text + '\n', () => { });
	};
	const createLogFile = (_filename = null, _options = {}) => {
		({ verbose, saveLogs } = _options);
		verbose && filenameLog && checkFileExists(filenameLog, false);

	};
	const add = (_message) => {
		if (verbose) {
			console.log(_message);
			if (filenameLog && saveLogs) {
				_message = today.format('YYYY-MM-DD-HH:mm:ss') + ' - ' + _message;
				appendFileSync(filenameLog, _message);
			}
		}
	};
	const saveCSV = (_filename = null, _quotes = null) => {
		if (verbose) {
			if (_filename && _quotes) {
				checkFileExists(_filename, true);
				appendFileSync(_filename, 'alloy_id,updated_at,created_at\n');
				appendFileSync(_filename, _quotes);
			}
		}
	};
	return {
		createLogFile,
		add,
		saveCSV
	};
})();

module.exports = FileUtils;
