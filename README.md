# chrome-extension-deploy

Deploy Chrome extensions to the Chrome Web Store.

You should probably use [chrome-webstore-upload](https://github.com/DrewML/chrome-webstore-upload) or [chrome-webstore-upload-cli](https://github.com/DrewML/chrome-webstore-upload-cli) instead.

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
