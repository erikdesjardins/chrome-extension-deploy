# chrome-extension-deploy [![Build Status](https://travis-ci.org/erikdesjardins/chrome-extension-deploy.svg?branch=master)](https://travis-ci.org/erikdesjardins/chrome-extension-deploy) [![Coverage Status](https://coveralls.io/repos/github/erikdesjardins/chrome-extension-deploy/badge.svg?branch=master)](https://coveralls.io/github/erikdesjardins/chrome-extension-deploy?branch=master)

Deploy Chrome extensions to the Chrome Web Store.

## Installation

`npm install --save-dev chrome-extension-deploy`

## Usage

```js
var fs = require('fs');
var deploy = require('chrome-extension-deploy');

deploy({
  // obtained by following the instructions here:
  // https://developer.chrome.com/webstore/using_webstore_api#beforeyoubegin
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
  // errors are sanitized, so your tokens will not be leaked
});
```
