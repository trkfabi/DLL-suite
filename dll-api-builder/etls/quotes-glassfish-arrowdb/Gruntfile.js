module.exports = function(grunt) {
	// Project configuration.
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		prettier: {
			files: {
				src: [
					// '.jsbeautifyrc',
					'package.json',
					'*.js',
					'lib/*.js',
					'bin/*.js',
					'test/*.js'
				]
			},
			options: {
				useTabs: true,
				singleQuote: true
			}
		},
		eslint: {
			target: ['*.js', 'lib/*.js', 'bin/*.js', 'test/*.js']
		}
	});

	// Load grunt plugins for modules.
	grunt.loadNpmTasks('grunt-prettier');

	// Register tasks.
	grunt.registerTask('default', ['prettier', 'eslint']);
};
