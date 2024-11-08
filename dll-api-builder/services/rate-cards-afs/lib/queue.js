function Queue() {
	let list = {};
	let count = 0;

	const add = (item) => {
		const index = count;
		list[index] = item;

		count += 1;

		return index;
	};

	const remove = (index) => {
		delete list[index];
	};

	const isEmpty = () => {
		return Object.keys(list).length === 0;
	};

	return {
		add,
		remove,
		isEmpty
	};
}

module.exports = Queue;
