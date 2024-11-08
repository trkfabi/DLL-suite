#!/usr/bin/env

const process = require('process');
const minimist = require('minimist');
const env = require('node-env-file');

const Helpers = require('../lib/reusable/helpers');

const Index = require('../index');

const argv = minimist(process.argv.slice(2));

const key = Helpers.presetVar('key', 'k', undefined, argv);
const username = Helpers.presetVar('username', 'u', undefined, argv);
const password = Helpers.presetVar('password', 'p', undefined, argv);
const verbose = Helpers.presetVar('verbose', 'v', undefined, argv);
const deleteDups = Helpers.presetVar('deleteDups', 'd', false, argv);
const createDups = Helpers.presetVar('createDups', 'c', false, argv);
const fullCycle = Helpers.presetVar('fullCycle', 'f', false, argv);
const saveLogs = Helpers.presetVar('saveLogs', 's', false, argv);
const noQuotes = Helpers.presetVar('noQuotes', 'q', false, argv);
const noEvents = Helpers.presetVar('noEvents', 'e', false, argv);

global.doLog = verbose;

const cwd = process.cwd();
env(`${cwd}/vars.env`);

Index.start({
	key,
	username,
	password,
	verbose,
	deleteDups,
	createDups,
	fullCycle,
	saveLogs,
	noQuotes,
	noEvents
});
