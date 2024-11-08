const assert = require('assert');
const moment = require('moment');
const uuid = require('uuid/v4');
const _ = require('lodash');

const QuoteUtils = require('../lib/quoteUtils');
const Random = require('./lib/reusable/random');

const mQuote = () => {
	return {
		id: Random.id(),
		updated_at: Random.date(
			moment().subtract(1, 'month'),
			moment(),
			'YYYY-MM-DDTHH:mm:ss+0000'
		),
		alloy_id: uuid()
	};
};

const mQuotes = (amount = 10) => {
	const quotes = [];

	for (let i = 0; i < amount; i++) {
		quotes.push(mQuote());
	}

	return quotes;
};

const mDuplicates = (quotesNumber, originalsNumber, dupsPerOriginalNumber) => {
	const originalQuotes = mQuotes(quotesNumber);
	const newDups = QuoteUtils.createDuplicates(
		originalQuotes,
		originalsNumber,
		dupsPerOriginalNumber
	);

	newDups.forEach(quote => {
		quote.id = Random.id();
		quote.updated_at = Random.date(
			moment().subtract(1, 'month'),
			moment(),
			'YYYY-MM-DDTHH:mm:ss+0000'
		);
	});

	return [...originalQuotes, ...newDups];
};

describe('etls/arrowdb-dups/unit/', () => {
	describe('lib/quoteUtils', () => {
		describe('#createDuplicates()', () => {
			it('should generate the correct amount of duplicates when the list of quotes is enough', () => {
				const originals = 5;
				const dupsPerOriginal = 3;
				const quotes = mQuotes(30);
				const duplicates = QuoteUtils.createDuplicates(
					quotes,
					originals,
					dupsPerOriginal
				);

				assert.equal(
					duplicates.length,
					originals * dupsPerOriginal,
					'duplicates length is not the expected'
				);

				duplicates.forEach(quote => {
					const { alloy_id, id } = quote;
					const original = quotes.find(
						originalQuote => originalQuote.alloy_id === alloy_id
					);

					assert.ok(original, `there is no quote with alloy_id: ${alloy_id}`);
					assert.notEqual(
						original.id,
						id,
						`duplicated the same arrowDB id: ${id}`
					);
				});
			});

			it('should generate a limited amount of duplicates if the array of quotes is limited', () => {
				const originalsNumber = 10;
				const dupsPerOriginalNumber = 10;
				const quotesNumber = 3;
				const quotes = mQuotes(quotesNumber);
				const duplicates = QuoteUtils.createDuplicates(
					quotes,
					originalsNumber,
					dupsPerOriginalNumber
				);

				assert.equal(
					duplicates.length,
					quotesNumber * dupsPerOriginalNumber,
					'duplicates length is not the expected'
				);
			});

			it('should not generate new quotes from an empty array', () => {
				const quotes = [];
				const duplicates = QuoteUtils.createDuplicates(quotes);

				assert.equal(duplicates.length, 0, 'duplicates length is not 0');
			});
		});

		describe('#findDuplicates()', () => {
			it('should find duplicates in an array of quotes with the same alloy_id', () => {
				const quotesNumber = 10;
				const originalsNumber = 5;
				const dupsPerOriginalNumber = 3;
				const quotes = mDuplicates(
					quotesNumber,
					originalsNumber,
					dupsPerOriginalNumber
				);
				const duplicates = QuoteUtils.findDuplicates(quotes);

				assert.equal(
					duplicates.duplicatesOriginals,
					originalsNumber,
					'amount of duplicatesOriginals is not the expected'
				);
				assert.equal(
					duplicates.duplicatesTotals,
					originalsNumber * dupsPerOriginalNumber,
					'amount of duplicatesTotals is not the expected'
				);
				assert.equal(
					duplicates.detail.length,
					originalsNumber,
					'result.detail.length is not the expected'
				);

				duplicates.detail.forEach(detailItem => {
					const { alloy_id, original, duplicates } = detailItem;

					assert.equal(
						alloy_id,
						original.alloy_id,
						`the original quote has not the same alloy_id as the on in the detail`
					);
					assert.equal(
						duplicates.length,
						dupsPerOriginalNumber,
						'amount of duplicates for original quote is not the expected'
					);

					duplicates.forEach(duplicate => {
						assert.equal(
							duplicate.alloy_id,
							alloy_id,
							`duplicated quote found does not match the original's alloy_id`
						);
						assert.ok(
							duplicate.updated_at <= original.updated_at,
							'duplicated found is newer than the original'
						);
					});
				});
			});
		});

		describe('#idsForArrow()', () => {
			it('should find all different ids to remove', () => {
				const quotesNumber = 10;
				const originalsNumber = 5;
				const dupsPerOriginalNumber = 3;
				const quotes = mDuplicates(
					quotesNumber,
					originalsNumber,
					dupsPerOriginalNumber
				);
				const duplicates = QuoteUtils.findDuplicates(quotes);
				const ids = QuoteUtils.idsForArrow(duplicates).split(',');

				assert.equal(
					ids.length,
					duplicates.duplicatesTotals,
					'amount of ids found is not expected'
				);
				assert.equal(
					ids.length,
					_.uniq(ids).length,
					'there are duplicated ids'
				);

				const { detail } = duplicates;
				detail.forEach(detailItem => {
					const {
						original: { id }
					} = detailItem;

					assert.ok(
						!ids.includes(id),
						'an original quote found to be deleted. Only duplicates should be marked to delete'
					);
				});
			});
		});
	});
});
