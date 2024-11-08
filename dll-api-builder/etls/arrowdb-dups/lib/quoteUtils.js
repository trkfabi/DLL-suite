const _ = require('lodash');
const QuoteUtils = (function () {
	const compare = (a, b, index = 0) => {
		if (a[index] === undefined && b[index] === undefined) {
			return 0;
		}

		if (a[index] < b[index] || (a[index] && b[index] === undefined)) {
			return 1;
		}

		if (a[index] > b[index] || (a[index] === undefined && b[index])) {
			return -1;
		}

		return compare(a, b, index + 1);
	};

	const findDuplicates = quotes => {
		const detail = [];
		const uniques = [];
		let duplicatesTotals = 0;

		quotes.sort((q1, q2) => {
			const { alloy_id: id1, updated_at: upd1 } = q1;
			const { alloy_id: id2, updated_at: upd2 } = q2;

			return compare([id1, upd1], [id2, upd2]);
		});

		let detailItem;
		quotes.forEach((quote, index) => {
			const { alloy_id } = quote;
			const nQuote = quotes[index + 1] || {};

			if (nQuote.alloy_id === alloy_id) {
				duplicatesTotals += 1;

				if (detailItem) {
					detailItem.duplicates.push(nQuote);
				} else {
					detailItem = {
						alloy_id,
						original: quote,
						duplicates: [nQuote]
					};
				}
			} else if (detailItem) {
				detail.push(detailItem);
				detailItem = undefined;
			} else {
				uniques.push(quote);
			}
		});

		return {
			duplicatesTotals,
			detail,
			duplicatesOriginals: detail.length,
			uniques
		};
	};

	/**
	 * @method groupDuplicates
	 * Formats an array of quotes to be organized in separate data structures
	 * @param {quote[]} Array of quotes to group
	 * @return {duplicateInfo[]}
	 */
	const groupDuplicates = dups => {
		const ids = {};
		const format = [];

		dups.forEach(quote => {
			const { alloy_id: id } = quote;

			if (ids[id]) {
				ids[id].n += 1;
			} else {
				ids[id] = {
					quote,
					n: 1
				};
			}
		});

		Object.values(ids).forEach(data => {
			format.push(data);
		});

		return format;
	};

	const createDuplicates = (
		quotes = [],
		originals = 10,
		dupsPerOriginal = 1
	) => {
		const duplicates = [];
		const { length } = quotes;
		let count = 0;

		quotes.forEach((quote, index) => {
			const rest = originals - count;
			const shouldDuplicate =
				rest > 0 && (rest >= length - index || !!Math.round(Math.random()));

			if (shouldDuplicate) {
				count += 1;

				for (let i = 0; i < dupsPerOriginal; i++) {
					const duplicate = JSON.parse(JSON.stringify(quote));
					delete duplicate.id;
					delete duplicate.created_at;
					delete duplicate.updated_at;
					duplicates.push(duplicate);
				}
			}
		});

		return duplicates;
	};

	const sort = quotes => {
		return quotes.sort((a, b) => {
			if (a.alloy_id > b.alloy_id) {
				return 1;
			}

			if (a.alloy_id === b.alloy_id) {
				return 0;
			}

			return -1;
		});
	};

	const idsForArrow = duplicates => {
		return duplicates.detail
			.reduce((ids, item) => {
				const { duplicates: dups } = item;

				const newIds = dups.map(({ id }) => id);

				return [...ids, ...newIds];
			}, [])
			.join(',');
	};

	const transformToCSV = _quotes => {
		const quotes = _quotes || [];
		let quoteRowInfo = '';
		quotes.forEach((_quote) => {
			quoteRowInfo += `${_quote.alloy_id},${_quote.updated_at},${_quote.created_at}\n`;
		});
		return quoteRowInfo;
	};

	const searchIdsFromDuplicatesForArrow = _duplicates => {
		const quotes = _duplicates.detail;
		let quoteRowIds = [];
		quotes.forEach((_quote) => {
			let duplicates = _quote.duplicates;
			duplicates.forEach((_dup) => {
				quoteRowIds.push(_dup.id);
			});
		});
		return quoteRowIds;
	};

	const prepareDuplicatesForLogs = _duplicates => {
		let originalQuotes = [];
		let duplicatedQuotes = [];

		_.each(_duplicates, _quote => {
			originalQuotes.push(_quote.original);
			duplicatedQuotes = _.concat(duplicatedQuotes, _quote.duplicates);
		});

		return {
			originalQuotes,
			duplicatedQuotes
		};
	};

	return {
		createDuplicates,
		findDuplicates,
		groupDuplicates,
		sort,
		idsForArrow,
		transformToCSV,
		searchIdsFromDuplicatesForArrow,
		prepareDuplicatesForLogs
	};
})();

module.exports = QuoteUtils;
