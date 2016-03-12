/**
 * @author Erik Desjardins
 * See LICENSE file in root directory for full license.
 */

'use strict';

var request = require('superagent');

var REQUIRED_FIELDS = ['clientId', 'clientSecret', 'refreshToken', 'id', 'zip'];

var PUBLIC = 'PUBLIC';
var TRUSTED_TESTERS = 'TRUSTED_TESTERS';

module.exports = function deploy(options) {
	const fieldError = REQUIRED_FIELDS.reduce(function(err, field) {
		if (err) return err;
		if (!options[field]) {
			return new Error('Missing required field: ' + field);
		}
	}, null);

	if (fieldError) {
		return Promise.reject(fieldError);
	}

	var clientId = options.clientId;
	var clientSecret = options.clientSecret;
	var refreshToken = options.refreshToken;
	var extensionId = options.id;
	var zipFile = options.zip;
	var publishTo = options.to || PUBLIC;

	var accessToken;

	return Promise.resolve()
		.then(function() {
			var req = request
				.post('https://accounts.google.com/o/oauth2/token')
				.field('client_id', clientId)
				.field('client_secret', clientSecret)
				.field('refresh_token', refreshToken)
				.field('grant_type', 'refresh_token')
				.field('redirect_uri', 'urn:ietf:wg:oauth:2.0:oob');

			return Promise.resolve(req)
				.then(function(response) {
					accessToken = response.body.access_token;
				}, function() {
					throw new Error('Failed to fetch access token.');
				});
		})
		.then(function() {
			var req = request
				.put('https://www.googleapis.com/upload/chromewebstore/v1.1/items/' + extensionId)
				.set('Authorization', 'Bearer ' + accessToken)
				.set('x-goog-api-version', 2)
				.type('application/zip')
				.send(zipFile);

			return Promise.resolve(req)
				.then(function(response) {
					if (response.body.uploadState !== 'SUCCESS') {
						throw new Error('Upload state "' + response.body.uploadState + '" !== "SUCCESS".');
					}
				}, function() {
					throw new Error('Failed to upload package.');
				});
		})
		.then(function() {
			var req = request
				.post('https://www.googleapis.com/chromewebstore/v1.1/items/' + extensionId + '/publish')
				.set('Authorization', 'Bearer ' + accessToken)
				.set('x-goog-api-version', 2)
				.set('Content-Length', 0);

			if (publishTo === TRUSTED_TESTERS) {
				request.set('publishTarget', 'trustedTesters');
			}

			return Promise.resolve(req)
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
