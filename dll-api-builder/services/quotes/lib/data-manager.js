const process = require('process');
const _ = require('lodash');
const ArrowDBConnector = require('./reusable/arrowDBConnector');
const RequestError = require('./reusable/errors/requestError');

const DataManager = (function () {
	const db = new ArrowDBConnector({
		key: process.env.ARROWDB_KEY,
		username: process.env.ARROWDB_USER,
		password: process.env.ARROWDB_PASS,
	});

	async function getQuotes(userId, options = {}) {
		const {
			where = {},
				limit = 1000,
				currentPage = 1
		} = options;

		if (!userId) {
			throw RequestError('missing user id');
		}

		const query = {
			limit,
			where: _.extend({
				salesRepID: userId
			}, where),
			skip: limit * (currentPage - 1),
			order: '-updated_at'
		};

		return await db.query('quote', query);
	}

	async function updateQuote(userId, data) {
		const {
			alloy_id
		} = data;

		if (!userId) {
			throw RequestError('missing user id');
		}

		if (alloy_id) {
			const [{
				id
			} = {}] = await getQuote({
				salesRepID: userId,
				alloy_id
			});

			data.id = id;
		}
		return await db.upsertItem('quote', data);
	}

	async function deleteQuote(userId, {
		id,
		alloy_id
	} = {}) {
		if (!userId) {
			throw RequestError('missing user id');
		}

		if (!id && !alloy_id) {
			throw RequestError('missing alloy_id or id to delete the quote');
		}

		let quote;

		if (alloy_id) {
			[quote] = await getQuote({
				salesRepID: userId,
				alloy_id
			});
		} else {
			[quote] = await getQuote({
				salesRepID: userId,
				id
			});
		}

		quote.deleted = true;

		return await db.updateItem('quote', quote);
	}

	async function getQuote(where) {
		return await db.query('quote', {
			where,
			limit: 1,
			order: '-updated_at'
		});
	}

	return {
		getQuotes,
		updateQuote,
		deleteQuote,
	};

})();

module.exports = DataManager;
