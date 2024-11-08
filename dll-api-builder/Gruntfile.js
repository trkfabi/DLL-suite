const process = require('process');

const _ = require('lodash');

const {
	readdirSync,
	statSync
} = require('fs');

const {
	join
} = require('path');

const {
	spawn
} = require('child_process');

module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt);

	const env = grunt.option('env') || 'dev';
	const ci = grunt.option('ci') || false;
	const testRemote = process.env.TEST_ENV === 'production';

	// Project configuration.
	grunt.initConfig({
		services: 'services',
		etls: 'etls',
		envs: {
			src: 'envs.json',
			destFile: 'vars.env', // file name to generate in services/*/
			etls: {
				'quotes-glassfish-arrowdb': 'quotes',
				'snp-arrowdb': 'snp-arrowdb'
			}
		},
		jsbeautifier: {
			files: [
				'*.json',
				'.jsbeautifyrc',
				'Gruntfile.js',
				'reusable/**/*.js',
				'services/*/*.json',
				'services/*/apis/**/*.js',
				'services/*/blocks/**/*.js',
				'services/*/lib/**/*.js',
				'services/*/conf/**/*.js',
				'services/*/models/**/*.js',
				'services/*/test/**/*.js',
				// 'services/*/web/**/*.js',
				// 'services/*/web/**/*.hb',
				'test/**/*.js',
				'!services/*/lib/reusable/**/*.js',
				'!services/*/test/reusable/**/*.js',
				'!etls/*/lib/reusable/**/*.js',
				'!etls/*/etl/reusable/**/*.js',
				'!package-lock.json',
				'!services/*/package-lock.json',
			],
			options: {
				config: '.jsbeautifyrc'
			}
		},
		eslint: {
			options: {
				format: ci ? 'json' : 'stylish',
				outputFile: ci ? 'reports/eslint.json' : ''
			},
			target: [
				'*.js',
				'reusable/**/*.js',
				'services/*/apis/**/*.js',
				'services/*/blocks/**/*.js',
				'services/*/lib/**/*.js',
				'services/*/conf/**/*.js',
				'services/*/models/**/*.js',
				'services/*/test/**/*.js',
				// 'services/*/web/**/*.js',
				'!services/*/lib/reusable/**/*.js',
				'!services/*/test/reusable/**/*.js',
				'!etls/*/lib/reusable/**/*.js',
				'!etls/*/etl/reusable/**/*.js',
				'services/*/conf/**/*.js',
				'services/*/models/**/*.js',
				'test/**/*.js',
			]
		},
		mochaTest: {
			unit: {
				options: {
					reporter: ci ? 'XUnit' : 'spec',
					captureFile: './test-results/unit-tests.xml',
					require: [
						'./reusable/test/lib/reusable/base.js',
						() => {
							doLog = false;
						}
					]

				},
				src: ['services/*/test/unit/**/*.js'],
			},
			e2e: {
				options: {
					reporter: ci ? 'XUnit' : 'spec',
					captureFile: `./test-results/e2e-${testRemote ? 'remote' : 'local'}.xml`,
					quiet: !!ci,
					timeout: 60 * 1000
				},
				src: ['test/**/*.js']
			}
		}
	});

	// Load grunt plugins for modules.
	grunt.loadNpmTasks('grunt-jsbeautifier');
	grunt.loadNpmTasks('grunt-mocha-test');

	const services = grunt.config('services');
	const etls = grunt.config('etls');

	const getFoldersIn = (folder = 'services') => {
		const custom = grunt.option(folder);
		if (custom) {
			return (custom || '')
				.replace(/[\s]/g, '')
				.split(',');
		}

		const dest = folder;
		const result = readdirSync(dest).filter(file => {
			return statSync(join(__dirname, dest, file)).isDirectory() && file.indexOf('@') === -1;
		});
		return result;
	};

	const execInServices = (cmd, args, options, done) => {
		if (_.isFunction(options)) {
			done = options;
			options = {};
		}

		const requests = getFoldersIn('services').map(service => {
			return new Promise((resolve, reject) => {
				const proc = spawn(cmd, args, {
					cwd: `./${services}/${service}`,
				});

				proc.stdout.on('data', data => {
					console.log(`[${service}] ${data}`);
				});

				proc.stderr.on('data', data => {
					console.log(`[${service}] ${data}`);
				});

				proc.on('error', error => {
					reject(error);
				});

				proc.on('close', code => {
					if (options.skipExitStatus) {
						return resolve(code);
					}

					if (code !== 0) {
						return reject(code);
					}

					resolve(code);
				});

			});
		});

		return Promise
			.all(requests)
			.then((code) => {
				done(code);
			})
			.catch(error => {
				done(error);
			});
	};

	// Register tasks.

	grunt.registerTask('version', function (type = 'patch') {
		const done = this.async();

		execInServices('npm', ['version', type], done);
	});

	grunt.registerTask('installNpm', function () {
		const done = this.async();
		let subcmd = 'install';

		if (ci) {
			subcmd = 'ci'
		}

		execInServices('npm', [subcmd], done);
	});

	grunt.registerTask('install', function (cmd = 'npm') {
		const done = this.async();
		let subcmd = 'install';

		execInServices(cmd, [subcmd], done);
	});

	grunt.registerTask('run', function () {
		const done = this.async();

		execInServices('node', ['.'], done);
	});

	grunt.registerTask('integration', function () {
		const done = this.async();

		let cmd = 'npm';
		let args = ['run', 'integration'];

		if (ci) {
			cmd = 'mocha';
			args = [
				'--recursive',
				'--timeout',
				'60000',
				'--reporter',
				'xunit',
				'--reporter-options',
				`output=test-results/integration-${testRemote ? 'remote' : 'local'}.xml`,
				'./test/integration/**/*.js'
			];
		}

		execInServices(cmd, args, {
			skipExitStatus: true
		}, done);
	});

	grunt.registerTask('reuse', (src) => {
		getFoldersIn('services').forEach(service => {
			const dest = join(__dirname, services, service);

			grunt.file.copy(src, dest);
			grunt.log.writeln(`Copied ${src} into ${dest}`);
		});

		getFoldersIn('etls').forEach(etl => {
			const dest = join(__dirname, etls, etl);

			grunt.file.copy(src, dest);
			grunt.log.writeln(`Copied ${src} into ${dest}`);
		});
	});

	grunt.registerTask('renameServices', (target) => {
		grunt.log.writeln(`Renaming Services to: ${target}`);
		const {
			scripts
		} = require('./package.json');

		getFoldersIn('services').forEach(service => {
			const servicePkgPath = join(__dirname, services, service, 'package.json');
			const servicePkg = require(servicePkgPath);
			const newName = `${target}-${service}`;

			servicePkg.name = newName;
			servicePkg.scripts = scripts;

			grunt.file.write(servicePkgPath, JSON.stringify(servicePkg));

			grunt.log.writeln(`Renamed service to: ${newName}`);
		});
	});

	grunt.registerTask('copyEnvs', (target) => {
		grunt.log.writeln(`loadEnvs: ${target}`);
		const options = grunt.config.get('envs');

		const json = grunt.file.readJSON(options.src);
		const env = json[target];

		const json2env = (...params) => {
			return _.chain({})
				.extend(...params)
				.map((value, key) => {
					return `${key}=${value}`;
				})
				.value()
				.join('\n');
		};

		if (!env) {
			grunt.log.writeln(`target not defined in ${options.src}, avoiding vars.`);
			return;
		}

		const {
			globals: {
				base = {},
			},
			[target]: {
				base: envBase = {}
			} = {}
		} = json;

		const targetEnvs = {
			'ENV_NAME': target
		};

		const testEnvs = join(__dirname, 'test', options.destFile);
		grunt.file.write(testEnvs, json2env(base, envBase, targetEnvs));

		grunt.log.writeln(`Saved envs for e2e test in: ${testEnvs}`);

		getFoldersIn('services').forEach(service => {
			const {
				globals: {
					[service]: globalService = {}
				},
				[target]: {
					[service]: envService = {}
				}
			} = json;

			const destPath = join(__dirname, services, service, options.destFile);

			grunt.file.write(destPath, json2env(base, globalService, envBase, envService, targetEnvs));
			grunt.log.writeln(`Saved envs in: ${destPath}`);
		});

		getFoldersIn('etls').forEach(etl => {
			const service = grunt.config.get(`envs.etls.${etl}`);
			const {
				globals: {
					[service]: globalService = {}
				},
				[target]: {
					[service]: envService = {}
				}
			} = json;
			const destPath = join(__dirname, etls, etl, options.destFile);

			grunt.file.write(destPath, json2env(base, globalService, envBase, envService, targetEnvs));
			grunt.log.writeln(`Saved envs in: ${destPath}`);
		});
	});

	grunt.registerTask('build', [
		'reuse:reusable',
		'jsbeautifier',
		'eslint',
		'mochaTest:unit'
	]);

	grunt.registerTask('initEnv', [
		`copyEnvs:${env}`,
		`renameServices:${env}`,
	]);

	grunt.registerTask('start', [
		'initEnv',
		'installNpm',
		'build',
		'run',
	]);

	grunt.registerTask('test', [
		'initEnv',
		'installNpm',
		'build',
		'integration',
		// 'mochaTest:e2e'
	]);

	grunt.registerTask('testRemote', [
		'initEnv',
		'installNpm',
		'reuse:reusable',
		'integration',
		// 'mochaTest:e2e'
	]);

	grunt.registerTask('dev', [
		`copyEnvs:${env}`,
		'build'
	]);

	grunt.registerTask('default', [
		'initEnv',
		'installNpm',
		'build',
	]);
};
