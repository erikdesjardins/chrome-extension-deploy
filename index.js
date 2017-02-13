/**
 * @author Erik Desjardins
 * See LICENSE file in root directory for full license.
 */

'use strict';

var request = require('superagent');

var PUBLIC = 'PUBLIC';
var TRUSTED_TESTERS = 'TRUSTED_TESTERS';

var REQUIRED_FIELDS = ['clientId', 'clientSecret', 'refreshToken', 'id', 'zip'];

module.exports = function deploy(options) {
	var clientId = options.clientId;
	var clientSecret = options.clientSecret;
	var refreshToken = options.refreshToken;
	var extensionId = options.id;
	var zipFile = options.zip;
	var publishTo = options.to || PUBLIC;

	return Promise.resolve()
		// options validation
		.then(function() {
			REQUIRED_FIELDS.forEach(function(field) {
				if (!options[field]) {
					throw new Error('Missing required field: ' + field);
				}
			});

			if (publishTo !== PUBLIC && publishTo !== TRUSTED_TESTERS) {
				throw new Error('Invalid publish target: ' + publishTo);
			}
		})
		// fetch access token
		.then(function() {
			return request
				.post('https://accounts.google.com/o/oauth2/token')
				.field('client_id', clientId)
				.field('client_secret', clientSecret)
				.field('refresh_token', refreshToken)
				.field('grant_type', 'refresh_token')
				.field('redirect_uri', 'urn:ietf:wg:oauth:2.0:oob')
				.then(function(response) {
					var accessToken = response.body.access_token;
					if (!accessToken) {
						throw new Error('No access token received.');
					}
					return accessToken;
				}, function() {
					throw new Error('Failed to fetch access token.');
				});
		})
		// upload extension
		.then(function(accessToken) {
			return request
				.put('https://www.googleapis.com/upload/chromewebstore/v1.1/items/' + extensionId)
				.set('Authorization', 'Bearer ' + accessToken)
				.set('x-goog-api-version', 2)
				.type('application/zip')
				.send(zipFile)
				.then(function(response) {
					if (response.body.uploadState !== 'SUCCESS') {
						throw new Error('Upload state "' + response.body.uploadState + '" !== "SUCCESS".');
					}
					return accessToken;
				}, function() {
					throw new Error('Failed to upload package.');
				});
		})
		// deploy extension
		.then(function(accessToken) {
			var req = request
				.post('https://www.googleapis.com/chromewebstore/v1.1/items/' + extensionId + '/publish')
				.set('Authorization', 'Bearer ' + accessToken)
				.set('x-goog-api-version', 2)
				.set('Content-Length', 0);

			if (publishTo === TRUSTED_TESTERS) {
				req.send({
					publish_to_trusted_testers: true,
					target: 'trustedTesters'
				});
			}

			return req
				.then(function(response) {
					if (response.body.status[0] !== 'OK') {
						throw new Error('Publish status "' + response.body.status[0] + '" !== "OK".');
					}
				}, function() {
					throw new Error('Failed to publish package.');
				});
		});
};

module.exports.PUBLIC = PUBLIC;
module.exports.TRUSTED_TESTERS = TRUSTED_TESTERS;
