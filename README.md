async-validation
================

Simple asynchronous validation for Node.js

## Usage

```javascript
var Validation = require('async-validation');

// let's add some custom validator with db call
Validation.addValidator('uniqueUsername', function (callback, value, rule) {
  User.findOne({ username: value }, function (err, user) {
		if (err || user) {
			return callback('Username exists');
		}
		return callback(null);
	});
});

var data = {
  username: 'john',
  email: 'john@sample.com'
};

var rules = {
  username: [
    { validator: 'notEmpty', message: 'Username required' }, // custom error message
    { validator: 'uniqueUsername' }
  ]
  email: [
    { validator: 'notEmpty' },
    { validator: 'email' }
  ]
};

var options = {}; // optional

var v = new Validation(data, rules, options);

v.validate(function (err) {
  if (err) {
    console.log(err); // i.e. { username: 'Username exists' }
    return;
  }
  console.log('Ok');
});
```

Note that validation will stop processing other rules for a given field when first error is encountered.
Also by default all textual input data is trimmed, pass `{ trim: false }` option to disable this feature.

## Default validators

### notEmpty

```javascript
{ validator: 'notEmpty' }
```

### enum

```javascript
{ validator: 'enum', values: ['male', 'female' }
```

### regexp

```javascript
{ validator: 'regexp', regexp: /^[a-zA-Z]{2}[a-zA-Z0-9_]{0,22}$/ }
```

### email

```javascript
{ validator: 'email' }
```

### url

```javascript
{ validator: 'url' }
```

### same

```javascript
{ validator: 'same', field: 'password_match' }
```
