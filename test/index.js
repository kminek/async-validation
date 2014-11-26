var assert = require('assert');
var Validation = require('../validation');

describe('Validation', function () {

	it('trimming input data & empty rules', function () {
		var data = {
			field: '  sample  ',
			field2: 'sample   ',
			field3: 1
		};
		var rules = {};
		var v = new Validation(data, rules, {
			trim: true
		});
		v.validate(function (err) {
			assert.equal(err, null);
			assert.deepEqual(v.data, {
				field: 'sample',
				field2: 'sample',
				field3: 1
			});
		});
	});

	it('error for non-existent field', function () {
		var data = {};
		var rules = {
			email: [
				{ validator: 'notEmpty' }
			]
		};
		var v = new Validation(data, rules);
		v.validate(function (err) {
			assert.deepEqual(err, {
				email: 'Required'
			});
		});
	});

	it('default validators', function () {
		var data = {
			username: 'jd12',
			name: 'john doe',
			password: 'password',
			password_match: 'password',
			gender: 'f',
			email: 'john.doe@example.com',
			website: 'http://example.com/'
		};
		var rules = {
			username: [{ validator: 'regexp', regexp: /^[a-zA-Z]{2}[a-zA-Z0-9_]{0,22}$/ }],
			name: [{ validator: 'notEmpty' }],
			password: [{ validator: 'same', field: 'password_match' }],
			gender: [{ validator: 'enum', values: ['m', 'f'] }],
			email: [{ validator: 'email' }],
			website: [{ validator: 'url' }]
		};
		var v = new Validation(data, rules);
		v.validate(function (err) {
			assert.equal(err, null);
		});
	});

});
