module.exports = {
	printWidth: 140,
	tabWidth: 4,
	useTabs: true,
	semi: true,
	singleQuote: true,
	trailingComma: 'es5',
	bracketSpacing: true,
	arrowParens: 'always',
	overrides: [
		{
			files: '.json',
			options: { parser: 'json' },
		},
	],
};
