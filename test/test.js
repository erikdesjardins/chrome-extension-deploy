import test from 'ava';
import superagent from 'superagent';
import superagentMock from 'superagent-mock';

import deploy from '../index.js';

test.beforeEach(t => {
	t.context.requests = [];
	t.context.mock = superagentMock(superagent, [{
		pattern: '^https://accounts.google.com/o/oauth2/token$',
		fixtures(match, params, headers) {
			t.context.requests.push({ match, params, headers });
			if (t.context.tokenFail) {
				throw new Error(500);
			}
			return t.context.tokenResponse;
		},
		post(match, data) {
			return { body: data };
		}
	}, {
		pattern: '^https://www.googleapis.com/upload/chromewebstore/v1.1/items/(\\w+)$',
		fixtures(match, params, headers) {
			t.context.requests.push({ match, params, headers });
			if (t.context.uploadFail) {
				throw new Error(500);
			}
			return t.context.uploadResponse;
		},
		put(match, data) {
			return { body: data };
		}
	}, {
		pattern: '^https://www.googleapis.com/chromewebstore/v1.1/items/(\\w+)/publish$',
		fixtures(match, params, headers) {
			t.context.requests.push({ match, params, headers });
			if (t.context.publishFail) {
				throw new Error(500);
			}
			return t.context.publishResponse;
		},
		post(match, data) {
			return { body: data };
		}
	}, {
		pattern: '.*',
		fixtures(match) {
			throw new Error('No mocked endpoint for: ' + match);
		}
	}]);
});

test.afterEach(t => {
	t.context.mock.unset();
});

test.serial('missing fields', async t => {
	await t.throwsAsync(
		deploy({ clientSecret: 'q', refreshToken: 'q', id: 'q', zip: 'q' }),
		'Missing required field: clientId'
	);
	await t.throwsAsync(
		deploy({ clientId: 'q', refreshToken: 'q', id: 'q', zip: 'q' }),
		'Missing required field: clientSecret'
	);
	await t.throwsAsync(
		deploy({ clientId: 'q', clientSecret: 'q', id: 'q', zip: 'q' }),
		'Missing required field: refreshToken'
	);
	await t.throwsAsync(
		deploy({ clientId: 'q', clientSecret: 'q', refreshToken: 'q', zip: 'q' }),
		'Missing required field: id'
	);
	await t.throwsAsync(
		deploy({ clientId: 'q', clientSecret: 'q', refreshToken: 'q', id: 'q' }),
		'Missing required field: zip'
	);
});

test.serial('invalid publish target', async t => {
	await t.throwsAsync(
		deploy({ to: 'foobar', clientId: 'q', clientSecret: 'q', refreshToken: 'q', id: 'q', zip: 'q' }),
		'Invalid publish target: foobar'
	);
});

test.serial('failing access token', async t => {
	t.context.tokenFail = true;

	await t.throwsAsync(
		deploy({ clientId: 'q', clientSecret: 'q', refreshToken: 'q', id: 'q', zip: 'q' }),
		'Failed to fetch access token.'
	);

	t.is(t.context.requests.length, 1, 'stopped after failure');
});

test.serial('no access token', async t => {
	t.context.tokenResponse = {};

	await t.throwsAsync(
		deploy({ clientId: 'q', clientSecret: 'q', refreshToken: 'q', id: 'q', zip: 'q' }),
		'No access token received.'
	);

	t.is(t.context.requests.length, 1, 'stopped after failure');
});

test.serial('failing upload', async t => {
	t.context.tokenResponse = { access_token: 'hi' };
	t.context.uploadFail = true;

	await t.throwsAsync(
		deploy({ clientId: 'q', clientSecret: 'q', refreshToken: 'q', id: 'q', zip: 'q' }),
		'Failed to upload package.'
	);

	t.is(t.context.requests.length, 2, 'stopped after failure');
});

test.serial('invalid upload state', async t => {
	t.context.tokenResponse = { access_token: 'hi' };
	t.context.uploadResponse = { uploadState: 'FAILURE' };

	await t.throwsAsync(
		deploy({ clientId: 'q', clientSecret: 'q', refreshToken: 'q', id: 'q', zip: 'q' }),
		'Upload state "FAILURE" !== "SUCCESS".'
	);

	t.is(t.context.requests.length, 2, 'stopped after failure');
});

test.serial('failing publish', async t => {
	t.context.tokenResponse = { access_token: 'hi' };
	t.context.uploadResponse = { uploadState: 'SUCCESS' };
	t.context.publishFail = true;

	await t.throwsAsync(
		deploy({ clientId: 'q', clientSecret: 'q', refreshToken: 'q', id: 'q', zip: 'q' }),
		'Failed to publish package.'
	);
});

test.serial('invalid publish status', async t => {
	t.context.tokenResponse = { access_token: 'hi' };
	t.context.uploadResponse = { uploadState: 'SUCCESS' };
	t.context.publishResponse = { status: ['ERR'] };

	await t.throwsAsync(
		deploy({ clientId: 'q', clientSecret: 'q', refreshToken: 'q', id: 'q', zip: 'q' }),
		'Publish status "ERR" !== "OK".'
	);
});

test.serial('public deploy', async t => {
	t.context.tokenResponse = { access_token: 'someaccesstoken' };
	t.context.uploadResponse = { uploadState: 'SUCCESS' };
	t.context.publishResponse = { status: ['OK'] };

	await deploy({ clientId: 'q', clientSecret: 'q', refreshToken: 'q', id: 'someid', zip: 'somezip' });

	const { requests: [tokenReq, uploadReq, publishReq] } = t.context;

	t.is(tokenReq.match[0], 'https://accounts.google.com/o/oauth2/token');

	t.is(uploadReq.match[1], 'someid');
	t.is(uploadReq.headers['Authorization'], 'Bearer someaccesstoken');
	t.is(uploadReq.headers['x-goog-api-version'], 2);
	t.is(uploadReq.headers['Content-Type'], 'application/zip');
	t.is(uploadReq.params, 'somezip');

	t.is(publishReq.match[1], 'someid');
	t.is(publishReq.headers['Authorization'], 'Bearer someaccesstoken');
	t.is(publishReq.headers['x-goog-api-version'], 2);
	t.is(publishReq.headers['Content-Length'], 0);
	t.false('publishTarget' in publishReq.headers);
});

test.serial('explicit public deploy', async t => {
	t.context.tokenResponse = { access_token: 'someaccesstoken2' };
	t.context.uploadResponse = { uploadState: 'SUCCESS' };
	t.context.publishResponse = { status: ['OK'] };

	await deploy({ to: deploy.PUBLIC, clientId: 'q', clientSecret: 'q', refreshToken: 'q', id: 'someid2', zip: 'somezip2' });

	const { requests: [tokenReq, uploadReq, publishReq] } = t.context;

	t.is(tokenReq.match[0], 'https://accounts.google.com/o/oauth2/token');

	t.is(uploadReq.match[1], 'someid2');
	t.is(uploadReq.headers['Authorization'], 'Bearer someaccesstoken2');
	t.is(uploadReq.headers['x-goog-api-version'], 2);
	t.is(uploadReq.headers['Content-Type'], 'application/zip');
	t.is(uploadReq.params, 'somezip2');

	t.is(publishReq.match[1], 'someid2');
	t.is(publishReq.headers['Authorization'], 'Bearer someaccesstoken2');
	t.is(publishReq.headers['x-goog-api-version'], 2);
	t.is(publishReq.headers['Content-Length'], 0);
	t.is(publishReq.params, undefined);
});

test.serial('deploy to trusted testers', async t => {
	t.context.tokenResponse = { access_token: 'someaccesstoken3' };
	t.context.uploadResponse = { uploadState: 'SUCCESS' };
	t.context.publishResponse = { status: ['OK'] };

	await deploy({ to: deploy.TRUSTED_TESTERS, clientId: 'q', clientSecret: 'q', refreshToken: 'q', id: 'someid3', zip: 'somezip3' });

	const { requests: [tokenReq, uploadReq, publishReq] } = t.context;

	t.is(tokenReq.match[0], 'https://accounts.google.com/o/oauth2/token');

	t.is(uploadReq.match[1], 'someid3');
	t.is(uploadReq.headers['Authorization'], 'Bearer someaccesstoken3');
	t.is(uploadReq.headers['x-goog-api-version'], 2);
	t.is(uploadReq.headers['Content-Type'], 'application/zip');
	t.is(uploadReq.params, 'somezip3');

	t.is(publishReq.match[1], 'someid3');
	t.is(publishReq.headers['Authorization'], 'Bearer someaccesstoken3');
	t.is(publishReq.headers['x-goog-api-version'], 2);
	t.is(publishReq.headers['Content-Length'], 0);
	t.deepEqual(publishReq.params, { publish_to_trusted_testers: true, target: 'trustedTesters' });
});
