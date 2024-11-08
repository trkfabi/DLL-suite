# ArrowDB Export
Exports any table(s) from ArrowDB as csv files

## Usage

```bash
$ npm i
$ node bin/index.js --key <arrowdb-app-key> --username <arrowdb-username> --password <arrowdb-password> --tables <t1,t2,...> [--options]
```

## Development mode

```bash
$ npm start --tables <t1,t2,...>  [-- options]
```
## Options

* `--verbose` | `-v`. Shows logs.
* `--help` | `-h`. Shows this help.
* `--key <arrowdb-app-key>` | `-k`. APP Key for ArrowDB
* `--username <arrowdb-username>` | `-u`. ArrowDB Username for login
* `--password <arrowdb-password>` | `-p`. ArrowDB Password for login
* `--tables <t1,t2,...>` | `-t`. List of tables to export, separated by commas
* `--file-format <format>` | `-f`. Format of the file to generate, per table. Flags supported:
	* `$table` Name of the table
	* `$date` Date as YYYYMMDD
	* `$time`  Time as HHmmss
	- Defaults: `$table-$date-$time`

## ArrowDB Connection.
To obtain the credentials of the ArrowDB instance, check the file `envs.json` and obtain the credentials from it.

- arrowdb-app-key: `ARROWDB_KEY`
- arrowdb-username: `ARROWDB_USER`
- arrowdb-password: `ARROWDB_PASS`


## Tables
Here are some of the most common tables to export from the different ArrowDB instances

### afs-rate-cards-afs

```
--tables rate_card,rate_factor,category,product,version
```

### mobile-services

```
--tables rating,version
```

### quotes

```
--tables quote,event
```
