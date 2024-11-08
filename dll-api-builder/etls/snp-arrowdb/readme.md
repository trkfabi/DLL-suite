# S&P Ratings Migrator
Migrates Credit Ratings from S&P into ArrowDB and creates a CSV file with the Ratings table information as backup

## Usage

```bash
# Dev Mode
$ npm start [-- options]

# Normal mode
$ node bin/index.js [options]
```

## Example

```bash
$ npm start -- --file assets/example.xlsx --sheet Sheet1 --save
$ npm start -- --file assets/example.xlsx --sheet Sheet1 --compareDatabase --verbose --save
```

## Options

* `--verbose` | `-v`. Shows logs.

* `--help` | `-h`. Shows this help in the cli.

* `--file <path-to-xls>` | `-f`. Specifies the XLS file to load for the migration.

* `--sheet <sheet-name>` | `-s`. Specifies the name of the sheet to load from the XLS file.

* `--compareDatabase` | `-c`. Generates a file comparing the old database with the new information from the file.

* `--save` | `-sd`. Flag to save to database.

* `--preventSnp` | `-snp`. Flag to skip the update data from S&P api.

* `--noFile` | `-nof`. Flag to not use a file in the process.

## Environment Variables.
To connect with ArrowDB and S&P, the script will try to load the file `vars.env` in this project's root folder.

To generate that file:

1. Go to the `dll-api-builder` folder.
1. Run `grunt`
1. Run the script from this ETL again.

```bash
$ cd <path-to-dll-api-builder>
$ grunt [--env=dev]
$ cd etls/snp-arrowdb
$ npm start
```