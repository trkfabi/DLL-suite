# Quote duplicates search tool (ArrowDB)
This tool is intended to look for duplicated quotes in arrowdb, by searching for similar `alloy_id` values in them.
Additionally, it could remove those found duplicated by leaving the most-updated item (based on its `update_time` value).

## Usage

```bash
$ [npm install]
$ node bin/index.js --key <arrowdb-key> --username <arrowdb-username> --password <arrowdb-password> [--deleteDups] [--createDups] [--verbose] [--fullCycle] [--noQuotes] [--noEvents]
```

### Flags

- `--key` | `-k`. Key for ArrowDB connection

- `--username` | `-u`. Username for an existing admin user in ArrowDB

- `--password` | `-o`. Password for an existing admin user in ArrowDB

- `--deleteDups` | `-d`. Removes the found duplicates and leaves the latest updated one.

- `--createDups` | `-c`. Creates new duplicates randomly, for existing quotes. Will not have any effect in empty DBs. **Note:** All created duplicates will automatically use a higher `updated_time`, making them the default quotes to stay in the DB is `--deleteDups` is active.

- `--verbose` | `-v`. Logs additional information while running the script.

- `--saveLogs` | `-s`. Save the logs to a file.

- `--noQuotes` | `-q`. Prevents the quotes from being processed.

- `--noEvents` | `-e`. Prevents the events from being processed.

- `--fullCycle` | `-f`. Runs a full cycle for the script: 

    1. creates additional duplicates for some existing quotes. 

    1. Looks for and marks the duplicated quotes. 

    1. Removes existing duplicates.

    1. Runs automated tests to ensure:

        - No quotes are duplicated.

        - The latests updated quote remained active.

        - There were not removed quotes without any duplicated also removed.

    1. All results are saved in separate files under the `results/` folder:

        - Duplicates generated
        
        - Duplicates found
        
        - Duplicates removed

        - Amount of quotes found before and after the script ran.


