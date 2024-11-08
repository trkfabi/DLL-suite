const { message, danger, warn } = require('danger');

const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const parser = require('xml2json');

prSize({
	maxLines: 600,
	maxFiles: 20,
});

tslint('reports', 'tslint.json');
junit('*/test-results.xml');

function prSize({ maxLines = 0, maxFiles = 0 } = {}) {
	const linesChanged = danger.github.pr.additions + danger.github.pr.deletions;
	const filesChanged = danger.git.modified_files + danger.git.added_files + danger.git.deleted_files;
	let count = 0;
	let type = null;

	if (linesChanged > maxLines) {
		count = linesChanged;
		type = 'lines';
	} else if (filesChanged > maxFiles) {
		count = filesChanged;
		type = 'files';
	}

	if (count > 0) {
		warn(
			[
				'**:exclamation: Big PR**',
				`This PR touches ${count} ${type}.`,
				"It's a good idea to separate it in 2 or more smaller PRs.",
			].join('\n')
		);
	}
}

function tslint(...paths) {
	const results = JSON.parse(fs.readFileSync(path.resolve(__dirname, ...paths)));

	let warnings = [];
	let errors = [];

	_.each(results, (item) => {
		const {
			name: filePath,
			ruleName,
			failure: message,
			ruleSeverity: severity,
			startPosition: { line, position: column },
		} = item;

		let output = {
			message,
			filePath,
			line,
		};

		switch (severity) {
			case 'error':
				errors.push(output);
				break;
			case 'warning':
				warnings.push(output);
				break;
		}
	});

	const eLength = errors.length;
	const wLength = warnings.length;

	if (eLength > 0) {
		fail(`**${eLength} TSLint Errors.**\nFix them to avoid future issues.`);
	}

	if (wLength > 0) {
		warn(`**${wLength} TSLint Warnings.**\nFixing them is encouraged as they could change to errors at anytime.`);
	}

	// https://github.com/danger/danger-js/issues/603 to avoid issues with too many messages
	if (wLength + eLength > 20) {
		return;
	}

	_.each(errors, (error) => {
		fail(error.message, error.filePath, error.line);
	});

	_.each(warnings, (warning) => {
		warn(warning.message, warning.filePath, warning.line);
	});
}

function junit(pattern) {
	const filePaths = glob.sync(pattern);

	let testsTotal = 0;
	let failuresTotal = 0;
	let skippedTotal = 0;
	let errorMessages = [];

	filePaths.forEach((filePath) => {
		let results = parser.toJson(fs.readFileSync(path.resolve(__dirname, filePath)));
		results = JSON.parse(results) || {};
		let { testsuite: { tests, failures, skipped, testcase } = {} } = results;

		tests = Number(tests);
		failures = Number(failures);
		skipped = Number(skipped);

		testsTotal += tests;
		failuresTotal += failures;
		skippedTotal += skipped;

		if (failures > 0) {
			const fileErrors = _.chain(testcase)
				.filter((item) => item.failure)
				.map((item, index) => {
					return [
						`${index + 1}. **${item.classname}**`,
						`* ${item.name}`,
						'',
						'```',
						`${JSON.stringify(item.failure).replace(/\\n/g, '\n')}`,
						'```',
					].join('\n');
				})
				.value();
			errorMessages.push(...fileErrors);
		}
	});

	if (testsTotal <= 0) {
		return;
	}

	message(`**${testsTotal} Total tests implemented!. Nice job!**`);

	if (skippedTotal > 0) {
		warn(`${skippedTotal} Tests are being skipped. Implement them to prevent regressions in the code.`);
	}

	if (failuresTotal > 0) {
		fail(`${failuresTotal} Tests failed.\nCheck them running "npm test":\n\n${errorMessages.join('\n')}`);
	}
}
