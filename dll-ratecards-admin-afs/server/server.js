const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('server/db.json');
const middlewares = jsonServer.defaults();

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);
server.use(
	jsonServer.rewriter({
		'/api/rate_cards/rate_cards': '/ratecards',
		'/api/rate_cards/rate_card/:id': '/ratecard',
		'/api/rate_cards/rate_cards?depth=1': '/ratecards',
		'/api/afs_rate_cards/version/recalculate/:id/?display=admin': '/recalculate',
		'/api/afs_rate_cards/import_list': '/importlist',
		'/api/rate_cards/rate_cards_vendor_codes': '/rate_cards_vendor_codes',
		'/api/rate_cards/vendor_code/create': '/vendor_code',
		'/api/rate_cards/vendor_code/delete': '/vendor_code',
		'/api/rate_cards/vendor_code/update': '/vendor_code',
	})
);
server.use(jsonServer.bodyParser);
server.use((req, res, next) => {
	if (req.method === 'POST') {
		if (req.body && req.body.username) {
			switch (req.body.username) {
				case 'afsuser':
					res.status(200).jsonp({
						success: true,
						'request-id': 'd92ea944-ea72-4ee0-9d71-1b30eb253080',
						key: 'result',
						result: {
							userId: 'RCCMTestuser3@portal.user',
							apiType: [
								{
									Description: null,
									Href: 'AFSRCM_DEV',
								},
							],
							authToken:
								'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJSQ0NNVGVzdHVzZXIzQHBvcnRhbC51c2VyIiwiYXBpVHlwZSI6W3siRGVzY3JpcHRpb24iOm51bGwsIkhyZWYiOiJBRlNSQ01fQUNDIn1dLCJpYXQiOjE1OTI0MTA4OTAsImV4cCI6MTU5MjQxNDQ5MH0.v4yhNAM6077pzNSGbVsBTs6SD1USgsZXLGOuWX8oZ8g',
							refreshToken:
								'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkbGxUb2tlbiI6IkEwNTQ1NzQ3QjA3REJDQjhCMzE2OTkyODk2QzUwRDA4IiwiaWF0IjoxNTkyNDEwODkwLCJleHAiOjE2MjM5Njg0OTB9.e997rUfw8mlPqi8Sv5luhd2tt2mgb6Z6yCPW-loMH20',
							rcmPermissions: 'AFSRCM_DEV',
						},
					});
					break;
				case 'othcrcm':
					res.status(200).jsonp({
						success: true,
						'request-id': 'a33235df-67a1-4d4a-a233-428def780c29',
						key: 'result',
						result: {
							userId: 'RCCMTestuser3@portal.user',
							apiType: [
								{
									Description: null,
									Href: 'OTHCRCM_DEV',
								},
							],
							authToken:
								'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJSQ0NNVGVzdHVzZXIzQHBvcnRhbC51c2VyIiwiYXBpVHlwZSI6W3siRGVzY3JpcHRpb24iOm51bGwsIkhyZWYiOiJBRlNSQ01fQUNDIn1dLCJpYXQiOjE1OTI0MTA2NjcsImV4cCI6MTU5MjQxNDI2N30.HIqKRI4akQAtu3FZEedQGOBygrVUrBzN84qhigR-PCk',
							refreshToken:
								'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkbGxUb2tlbiI6IkEwNTQ1NzQ3QjA3REJDQjhCMzE2OTkyODk2QzUwRDA4IiwiaWF0IjoxNTkyNDEwNjY3LCJleHAiOjE2MjM5NjgyNjd9.PhN4uHxthDTyc_zx3fNJoN7sIXN8_-8dy3P2lDwpd3Q',
							rcmPermissions: 'OTHCRCM_DEV',
						},
					});
					break;
				case 'othcadmin':
					res.status(200).jsonp({
						success: true,
						'request-id': 'd92ea944-ea72-4ee0-9d71-1b30eb253080',
						key: 'result',
						result: {
							userId: 'RCCMTestuser3@portal.user',
							apiType: [
								{
									Description: null,
									Href: 'OTHCRCMADMIN_DEV',
								},
							],
							authToken:
								'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJSQ0NNVGVzdHVzZXIzQHBvcnRhbC51c2VyIiwiYXBpVHlwZSI6W3siRGVzY3JpcHRpb24iOm51bGwsIkhyZWYiOiJBRlNSQ01fQUNDIn1dLCJpYXQiOjE1OTI0MTA4OTAsImV4cCI6MTU5MjQxNDQ5MH0.v4yhNAM6077pzNSGbVsBTs6SD1USgsZXLGOuWX8oZ8g',
							refreshToken:
								'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkbGxUb2tlbiI6IkEwNTQ1NzQ3QjA3REJDQjhCMzE2OTkyODk2QzUwRDA4IiwiaWF0IjoxNTkyNDEwODkwLCJleHAiOjE2MjM5Njg0OTB9.e997rUfw8mlPqi8Sv5luhd2tt2mgb6Z6yCPW-loMH20',
							rcmPermissions: 'OTHCRCMADMIN_DEV',
						},
					});
					break;
				default:
					res.sendStatus(401);
					break;
			}
		}
	}
	next();
});
server.use(router);

server.listen(8080, () => {
	console.log('JSON Server is running');
});
