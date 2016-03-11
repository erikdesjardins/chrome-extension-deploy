import test from 'ava';
import superagent from 'superagent';
import superagentMock from 'superagent-mock';

import deploy from '../index.js';

test('missing fields', t => {
	t.throws(
		() => deploy({ clientSecret: 'q', refreshToken: 'q', id: 'q', zip: 'q' }),
		'Missing required field: clientId'
	);
	t.throws(
		() => deploy({ clientId: 'q', refreshToken: 'q', id: 'q', zip: 'q' }),
		'Missing required field: clientSecret'
	);
	t.throws(
		() => deploy({ clientId: 'q', clientSecret: 'q', id: 'q', zip: 'q' }),
		'Missing required field: refreshToken'
	);
	t.throws(
		() => deploy({ clientId: 'q', clientSecret: 'q', refreshToken: 'q', zip: 'q' }),
		'Missing required field: id'
	);
	t.throws(
		() => deploy({ clientId: 'q', clientSecret: 'q', refreshToken: 'q', id: 'q' }),
		'Missing required field: zip'
	);
});
