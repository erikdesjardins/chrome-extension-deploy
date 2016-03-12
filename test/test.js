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
	}]);
});

test.afterEach(t => {
	t.context.mock.unset();
});

test('missing fields', t => {
	t.throws(
		deploy({ clientSecret: 'q', refreshToken: 'q', id: 'q', zip: 'q' }),
		'Missing required field: clientId'
	);
	t.throws(
		deploy({ clientId: 'q', refreshToken: 'q', id: 'q', zip: 'q' }),
		'Missing required field: clientSecret'
	);
	t.throws(
		deploy({ clientId: 'q', clientSecret: 'q', id: 'q', zip: 'q' }),
		'Missing required field: refreshToken'
	);
	t.throws(
		deploy({ clientId: 'q', clientSecret: 'q', refreshToken: 'q', zip: 'q' }),
		'Missing required field: id'
	);
	t.throws(
		deploy({ clientId: 'q', clientSecret: 'q', refreshToken: 'q', id: 'q' }),
		'Missing required field: zip'
	);
});
