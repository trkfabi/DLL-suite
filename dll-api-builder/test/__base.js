const env = require('node-env-file');

env(`${__dirname}/vars.env`);

global.doLog = false;
global.should = require('should');
global.request = require('request-promise-native');

global.GATEWAY_APIKEY = "ALVS0Ap8ZAcjMvezb60rGgeQmwJbue9g";
global.DLL_SERVICES_APIKEY = "FgbbVGNkZWhwQgEPb?>fGLjuguX7qQZ3hKUJ4TPn";
global.RATE_CARDS_AFS_APIKEY = "?UKqNMoCvgo9JBkdfRnRu@QhWREin8nZvL8yDaXK";
global.QUOTES_APIKEY = "TnzxiXJFiTQbMPiuZYP7gdJbwV4hsbwr2wBqCu>";
