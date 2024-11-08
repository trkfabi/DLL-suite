# DLL Quotes Migrator

## Usage

### Migrator CLI
Runs the whole process to migrate quotes:

#### Requirements for the migration to work.
1. Access to any MySQL DB with the proper schema from DLL Quotes repository.
1. If the access is to a local MySQL DB, make sure mysql is running first.
1. If the access is to a remote MySQL DB, make sure the DBM accept remote connections.
1. Have the environment properly set-up under `envs/`.
1. Internet connection.


#### What the process does.
1. Grab QUOTEBLOB entries from MySQL
1. Parse blobs to JSON objects
1. Save JSON into ArrowDB
1. Save results in local SQLite DB:
	- `sync`: Quotes that could be saved in ArrowDB with no issues.
	- `retry`: Quotes that could not be saved in ArrowDB.
	- `blocked`: Blobs that could not be parsed from MySQL.

If the CLI option `--retry <n>` is included, the process will try to upload the quotes in `retry` again as many times as `n`.

#### Running the process.

```bash
$ npm i
$ node bin/index.js [--help]
```

### Test suite
Runs the automated testing script to check `sync` quotes in ArrowDB.

#### Requirements for the tests to work:
1. Have run the Migrator process first, so the SQLite DB exists and at least 1 QUOTEBLOB is saved in `sync`.
1. Have the environment properly set-up under `envs/`.
1. Internet connection.

#### What the tests do.
1. Check the `sync` QUOTEBLOB for **required** properties in all quotes:
	- `alloy_id`
	- `salesRepID`
	- `submitStatus`
1. Check each QUOTEBLOB against its same data saved in ArrowDB. Based in its `alloy_id`
1. Saves all results under `test-results/`

#### Running the tests.

```bash
$ npm i
$ node test/index.js
```

## Development mode

- For the migrator process, in a local environment, run:

	```bash
	$ npm start [-- options]
	```

- For the tests, in a local environment, run:

	```bash
	$ npm test [-- options]
	```

## MySQL Database
Right now we're using Backups from the real Database, in order to make this script work with that backup, you must install a local MySQL server and install the backup on it.

### Setting up the local MySQL server

- Example using homebrew: https://stackoverflow.com/questions/4359131/brew-install-mysql-on-mac-os#6378429

- Default user: `root`

- Starting the server:
	
	```bash
	$ mysql.server start
	```

- Connecting to the server from CLI:

	```bash
	$ mysql -u root -p dll
	```

### Installing the Backup

- Example restoring from a backup: https://www.liquidweb.com/kb/how-to-back-up-mysql-databases-from-the-command-line/

	```bash
	$ mysqladmin -u root -p create <db_name>
	$ mysql -u root -p <db_name> < <file_name.sql>
	```

- You may need to increase the file size in the config files!


### Troubleshoot
  >Client does not support authentication protocol requested by server; consider upgrading MySQL client | NodeJs | MySQL Client v 2.12.0 #1574 

  - [https://github.com/mysqljs/mysql/issues/1574](https://github.com/mysqljs/mysql/issues/1574)

  ```sql
  alter user 'USER'@'localhost' identified with mysql_native_password by 'PASSWORD'
  ```

