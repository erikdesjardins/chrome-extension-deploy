# chrome-extension-deploy [![Build Status](https://travis-ci.org/erikdesjardins/chrome-extension-deploy.svg?branch=master)](https://travis-ci.org/erikdesjardins/chrome-extension-deploy) [![Coverage Status](https://coveralls.io/repos/github/erikdesjardins/chrome-extension-deploy/badge.svg?branch=master)](https://coveralls.io/github/erikdesjardins/chrome-extension-deploy?branch=master)

Deploy Chrome extensions to the Chrome Web Store.

## Installation

`npm install --save-dev chrome-extension-deploy`

## Usage

Note: `chrome-extension-deploy` requires `Promise` support.
If your environment does not natively support promises, you'll need to provide [your own polyfill](https://github.com/floatdrop/pinkie).

```js
var fs = require('fs');
var deploy = require('chrome-extension-deploy');

deploy({
  // clientId, clientSecret and refreshToken obtained by following the instructions here:
  // https://developer.chrome.com/webstore/using_webstore_api#beforeyoubegin
  // unfortunately it seems that you cannot use an ordinary private key, you must use OAuth
  clientId: 'myClientId',
  clientSecret: 'myClientSecret',
  refreshToken: 'myRefreshToken',

  // the ID of your extension
  id: 'kpohkfndjhilfenfoljcpcacccfngemc',

  // a Buffer or string containing your zipped extension
  zip: fs.readFileSync('path/to/zipped/extension.zip'),

  // whether to publish your extension to the public or trusted testers
  // OPTIONAL (default `deploy.PUBLIC`)
  to: deploy.TRUSTED_TESTERS
}).then(function() {
  // success!
}, function(err) {
  // failure :(
  // errors are sanitized, so your clientId/clientSecret/refreshToken will not be leaked
});
```
