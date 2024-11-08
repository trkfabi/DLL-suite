var args = arguments[0] || {};
var pdfGeneration = require('/pdf/pdfGeneration');
var appNavigation = require('/appNavigation');
var sessionManager = require('/utils/sessionManager');
var configsManager = require('/utils/configsManager');
var analytics = require('/utils/analytics');

var languageSelected = sessionManager.getDocsLang();

var doneCallback = args.doneCallback;
var quote = args.quote;
var recipient = args.recipient;

var pdfHandler = null;
var pdfsToLoad = [];
var pdfs = [];
var continueAnimation = {
	width: 0,
	duration: 500
};
var continueSlice = 0;

function init() {
	analytics.captureApm('[generateWindow] - create()');

	pdfs = [];

	if (languageSelected.key === 'en') {
		moment.locale('en');
	} else {
		var momentLanguage = require('external/momentLanguages/' + languageSelected.key);
		moment.locale(languageSelected.key, momentLanguage);
	}

	pdfHandler = configsManager.getLib('pdfHandler');

	pdfsToLoad = pdfHandler.handlePDFCreation({
		quote: quote,
		recipient: recipient
	});

	if (pdfsToLoad) {
		continueSlice = 100 / pdfsToLoad.length;
		generatePDFWithIndex(0);
	} else {
		appNavigation.closeGenerateWindow();

		doneCallback && doneCallback({
			attachments: pdfs,
			success: pdfs.length > 0,
			recipient: recipient
		});
	}
};

function generatePDFWithIndex(_index) {
	var pdfToLoad = pdfsToLoad[_index];

	if (pdfToLoad) {
		_.extend(pdfToLoad, args, {
			index: _index
		});

		var pdfData = recipient == 'proposal' ? pdfHandler.handlePDFProposalGeneration(pdfToLoad) : pdfHandler.handlePDFGeneration(
			pdfToLoad);

		pdfData.successCallback = function (_pdfFile) {
			_pdfFile = _pdfFile || {};

			doLog && console.log('[generateWindow] - generatePDFWithIndex() - ' + _index + ' success() - ' + JSON.stringify(
				_pdfFile));

			pdfs.push(_pdfFile);
			continueAnimation.width = (continueSlice * (_index + 1)) + '%';

			$.progressView.animate(continueAnimation, function () {
				generatePDFWithIndex(_index + 1);
			});

		};
		pdfData.failCallback = function (_data) {
			doLog && console.error('[generateWindow] - generatePDFWithIndex() - ' + _index + ' failure() - ' + JSON.stringify(
				_data));

			continueAnimation.width = (continueSlice * (_index + 1)) + '%';

			$.progressView.animate(continueAnimation, function () {
				generatePDFWithIndex(_index + 1);
			});
		};

		if (pdfData.shouldGenerateWithWebView) {
			pdfData.wrapper = $.container;
			pdfGeneration.generateWithWebView(pdfData);
		} else {
			pdfGeneration.generatePDFWithTemplate(pdfData);
		}
	} else {
		appNavigation.closeGenerateWindow();

		doneCallback && doneCallback({
			attachments: pdfs,
			success: pdfs.length > 0,
			recipient: recipient
		});
	}
};

init();
