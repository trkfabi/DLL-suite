/**
 * Instance for managing file writing
 * @class lib.fileWriter
 * @singleton
 */
const fs = require('fs');

const FileWriter = (function() {
	const checkFileExists = _filename => {
		if (_filename.indexOf('/') > 0) {
			const folder = _filename.substring(0, _filename.indexOf('/') + 1);
			if (!fs.existsSync(folder)) {
				fs.mkdirSync(folder);
			}
		}
		if (fs.existsSync(_filename)) {
			fs.unlinkSync(_filename);
		}
	};

	const appendFile = (_filename, _text) => {
		fs.appendFile(_filename, _text, () => {});
	};

	const appendFileSync = (_filename, _text) => {
		fs.appendFileSync(_filename, _text, () => {});
	};

	function writeEntityToFile(_filename, _entity) {
		let row = ',,,,,';
		if (_entity) {
			row = '';
			if (_entity.entity_rxid) {
				row += `${_entity.entity_rxid},`;
			} else {
				row += ',';
			}
			if (_entity.entity_name) {
				row += `"${_entity.entity_name}",`;
			} else {
				row += ',';
			}
			if (_entity.entity_parent) {
				row += `"${_entity.entity_parent}",`;
			} else {
				row += ',';
			}
			if (_entity.lt_rating) {
				row += `${_entity.lt_rating},`;
			} else {
				row += ',';
			}
			if (_entity.st_rating) {
				row += `${_entity.st_rating},`;
			} else {
				row += ',';
			}
		}
		appendFileSync(_filename, row);
	}

	return {
		appendFile,
		appendFileSync,
		checkFileExists,
		writeEntityToFile
	};
})();

module.exports = FileWriter;
