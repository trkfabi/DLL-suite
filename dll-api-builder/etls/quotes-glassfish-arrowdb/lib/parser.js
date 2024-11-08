/**
 * Transforms data from 1 source into another
 * @class lib.parser
 * @singleton
 */

const LOG_TAG = '\x1b[35m' + '[lib/parser]' + '\x1b[39;49m ';

const Parser = (function() {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method parseQuotes
	 * Transforms quoteblob data into real JS objects
	 * @param {object[]} quoteBlobs=[] List of quoteBlobs to parse
	 * @return {object[]}
	 */
	function parseQuotes(quoteBlobs = []) {
		doLog && console.debug(LOG_TAG, '- parseQuotes');

		let result = {
			quotes: [],
			analytics: [],
			errors: []
		};

		quoteBlobs.forEach(quoteBlob => {
			try {
				const value = quoteBlob.value || '{}';
				const quoteToParse = value
					.replace(/'/g, '"')
					.replace(/([\w\s])"([\w\s])/g, "$1'$2");
				const item = JSON.parse(quoteToParse);

				if (item.isAnalytics) {
					result.analytics.push(item);
				} else {
					result.quotes.push(item);
				}
			} catch (error) {
				if (quoteBlob) {
					result.errors.push(quoteBlob);
				} else {
					result.errors.push({
						ID: Date.now(),
						value: JSON.stringify({
							message: 'no quote to save'
						}),
						LASTSAVED: null,
						REMOVED: 1,
						SALESREPSID: null
					});
				}
			}
		});

		return result;
	}

	return {
		parseQuotes
	};
})();

module.exports = Parser;
