# DLL API Builder
Micro-services and ETL (Entry-Transform-Load) processes to serve data in the mobile and web apps for DLL.

## Table of contents.
<!-- MarkdownTOC autolink=true bracket=round -->

- [Requirements](#requirements)
	- [Node.js](#nodejs)
	- [npm dependencies](#npm-dependencies)
- [Usage](#usage)
	- [Using grunt.](#using-grunt)
		- [Grunt options](#grunt-options)
			- [Tasks](#tasks)
			- [Flags](#flags)
	- [Running the service directly](#running-the-service-directly)
- [Deploy](#deploy)
	- [Automated Deploy](#automated-deploy)
	- [Manual Deploy](#manual-deploy)
	- [Troubleshooting deploy](#troubleshooting-deploy)
- [Reusable folder](#reusable-folder)
- [ETLs](#etls)

<!-- /MarkdownTOC -->

## Requirements

### Node.js
- v8.12.x

You can download it from it's [official page](https://nodejs.org/en/), or manage it with [homebrew](https://brew.sh/), [nvm](https://github.com/creationix/nvm) or [n](https://www.npmjs.com/package/n).

### npm dependencies
- [Appcelerator CLI](https://docs.axway.com/bundle/Appcelerator_CLI_allOS_en/page/appcelerator_cli.html)

- [Grunt](https://gruntjs.com/)

- [Mocha (for automated tests)](https://mochajs.org/)

```bash
$ npm install -g appcelerator grunt-cli mocha
$ appc setup # Follow the instructions in console
```

## Usage

### Using grunt.
Use grunt when you need to **start**, **initialize** or **test** multiple services at the same time.

* Running all the servers locally, pointing to `dev` environment.
	```bash
	$ grunt start
	```

* Running all the automated tests.

	```bash
	$ grunt test
	```

* Initializing all services without running them.
	
	```bash
	$ grunt
	```

#### Grunt options
Using the grunt tasks:

```bash
$ grunt [build|initEnv|start|test|testRemote|dev|default|version:<patch|minor|major>] [--env=<dev|tst|acc|prod>] [--services=<services>] [--ci]
```

##### Tasks
All the tasks are applied on all the services (all projects under `services/`), unless `--services=<services>` is specified.

* `build`. Initializes reusable files, runs formatter, linter and unit tests.

* `initEnv`. Initializes environment variables and renames services.

* `start`. `build`, `initEnv`, installs npm dependencies and run.

* `test`. `build`, `initEnv`, installs npm and appc dependencies and test.

* `testRemote`. `initEnv`, installs npm dependencies and test **remotely**  (directly on the 
"cloud", without mounting them in the machine).

* `dev`. initializes environment variables and `build`.

* `default`. `initEnv`, install npm dependencies and `build`.

* `version`. Similar to `npm version`, but runs in all services. e.g. `grunt version:patch`, `grunt version:minor --services=gateway,rate-cards-afs`

##### Flags

* `--env=<dev|tst|acc|prod>`. Uses the given environment for the `vars.env` files generated. Defaults to `dev`.

* `--services=<services>`. The tasks will affect only those services specified, separated by comma (e.g. `rate-cards-afs,gateway,quotes`). Defaults to all projects under `services/`.

* `--ci`. Will run the tasks as the CI server. i.e. `npm ci` instead of `npm i`; tests will be saved in xml files under `test-results`, etc.

### Running the service directly
Use the service directly when you need to **run**, **test** or **deploy** only 1 service.

* Running a service, pointing to `dev`.
	```bash
	$ cd services/<path-to-service>
	$ npm install # Optional, if you haven't installed the dependencies
	$ npm run dev # it may ask you for credentials of appcelerator
	# npm run dev:tst # Will point to tst instead of dev
	```

* Testing a service, pointing to `dev`.
	```bash
	$ cd services/<path-to-service>
	$ npm install # Optional, if you haven't installed the dependencies
	$ appc install # Optional, if your dependencies from appc repo are not installed
	$ npm run test:dev # it may ask you for credentials of appcelerator
	# npm run test:tst # Will point to tst instead of dev
	```

## Deploy

### Automated Deploy
To trigger automated deploys from the CI server, follow these steps:

1. Merge all the required PRs to `dev`.

1. Checkout `dev` and bump the version of the `service(s)` that were updated.

	```bash
	$ cd service/<service-updated>
	$ npm version patch
	```

	- If you need to bump multiple services or all, you can use the special grunt task:

		```bash
		$ grunt version:patch [--services=<services-to-update>]
		```

	- The options of versions to bump are the same as [semver](https://semver.org/):

		- `patch` for bugfixes.
		- `minor` for new features that are backward-compatible.
		- `major` for breaking changes, not compatible with previous versions.

1. Commit and push the required changes for the versions.

1. Merge from `dev` into `tst` and push the changes.

1. Jenkins will automatically start to build, it will take some time since it will run all the tests before deploying.

1. To check its progress, refer to this [link](https://ci2.propelics.com/view/DLL/job/DLL%20-%20API%20Builder/).

### Manual Deploy
**Please note: the CI server already does this after each `git push` in the  branches: `tst`, `acc`, `stage`, `prod`**

To Deploy a service manually, follow these instructions:

1. In the main folder project, make sure you are pointing to the correct environment.

	```bash
	$ cd <path-to-dll-api-builder>
	$ grunt --env=<tst|acc|prod>
	```
1. On the service(s) folder(s), upload to appc.

	```bash
	$ cd services/<service-path>
	$ npm version <patch|minor|major> # Make sure you bump the version
	$ appc logout -D
	$ appc login # Use valid credentials for uploading
	$ appc publish
	```

### Troubleshooting deploy
Some common errors.

> The version is already published

You forgot to bump the version: `$npm version <patch|minor|major>`, depending on the changes you are uploading.

> There is already 10 versions published for this instance.

Appc won't let us having more than 10 versions:
	
1. Go to the [dashboard](https://platform.axway.com/#/app). Login if needed.
1. Search for the API Builder instance.
1. Navigate to "Publish history".
1. In the versions published, delete as many as needed.
1. Try to publish again.

> ERRCONRESET when publishing.

This error happens regularly with appc servers, you can still follow the publish status on the Dashboard.

## Reusable folder
All folders under the `reusable/` folder are automatically copied in all folders under `services/` and `etl/`, make sure you don't add or edit files under those generated folders.

## ETLs
Projects under `etl/` are stand-alone Node.js projects used as CLI for automation purposes, make sure you read and update their **readme** files to check their purpose and usage.



