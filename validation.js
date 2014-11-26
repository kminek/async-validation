var _ = require('underscore');
var async = require('async');

var Validation = function (data, rules, options) {
	this.data = data;
	this.rules = rules;
	this.errors = {};
	this.options = _.extend({
		trim: true
	}, (options || {}));

	if (this.options.trim) {
		for (var field in data) {
			if (typeof data[field] === 'string') {
				data[field] = data[field].trim();
			}
		}
	}
};

Validation.prototype = {

	constructor: Validation,

	/**
	 * Container for all validators shared across instances
	 * @type {Object}
	 */
	validators: {},

	/**
	 * Validates instance data
	 * @param  {Function} callback
	 */
	validate: function (callback) {
		var self = this;
		var fields = [];
		this.errors = {};
		for (var field in this.rules) {
			fields.push(field);
		}
		async.map(fields, this.validateField.bind(this), function (err, fieldsResults) {
			_.each(fieldsResults, function (fieldResult, i) {
				if (fieldResult !== true) {
					self.errors[fields[i]] = fieldResult;
				}
			});
			return (Object.keys(self.errors).length === 0) ? callback(null) : callback(self.errors);
		});
	},

	/**
	 * Validates single field
	 * Invokes callback(null, true) if field passed validation
	 * Invokes callback(null, 'error message') otherwise
	 * @param  {String}   field
	 * @param  {Function} callback
	 */
	validateField: function (field, callback) {
		var fieldValidators = [];
		_.each(this.rules[field], function (rule) {
			fieldValidators.push(this.createTaskCallback(rule, field));
		}, this);
		async.series(fieldValidators, function (err, results) {
			if (err) {
				return callback(null, err);
			}
			callback(null, true);
		});
	},

	/**
	 * Creates callback function for async.series
	 * @param  {Object} rule
	 * @param  {String} field
	 */
	createTaskCallback: function (rule, field) {
		var self = this;
		var value = self.data[field] || null;
		var proxy = function (cb) {
			self.validators[rule.validator].call(self, cb, value, rule);
		};
		return function (callback) {
			proxy(function (err) {
				if (err) {
					// handle setting custom error message inside rule
					var message = (typeof rule.message !== 'undefined') ? rule.message : err;
					return callback(message);
				}
				callback(null);
			});
		};
	}

};

/**
 * Adds validator
 * @param {String} name
 * @param {Function} fn
 */
Validation.addValidator = function (name, fn) {
	this.prototype.validators[name] = fn;
};

/**
 * Validator: notEmpty
 * @param  {Function} callback
 * @param  {Mixed}    value
 * @param  {Object}   rule
 */
Validation.addValidator('notEmpty', function (callback, value, rule) {
	if (!value || value.length === 0) {
		return callback('Required');
	}
	return callback(null);
});

/**
 * Validator: enum
 * Checks if `rule.values` contains value
 * @param  {Function} callback
 * @param  {Mixed}    value
 * @param  {Object}   rule
 */
Validation.addValidator('enum', function (callback, value, rule) {
	if (!_.contains(rule.values, value)) {
		return callback('Invalid value');
	}
	return callback(null);
});

/**
 * Validator: regexp
 * Checks if value passes regular expression inside `rule.regexp`
 * @param  {Function} callback
 * @param  {Mixed}    value
 * @param  {Object}   rule
 */
Validation.addValidator('regexp', function (callback, value, rule) {
	if (!rule.regexp.test(value)) {
		return callback('Invalid value');
	}
	return callback(null);
});

/**
 * Validator: email
 * @param  {Function} callback
 * @param  {Mixed}    value
 * @param  {Object}   rule
 */
Validation.addValidator('email', function (callback, value, rule) {
	var pattern = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
	if (!pattern.test(value)) {
		return callback('Invalid email');
	}
	return callback(null);
});

/**
 * Validator: url
 * @param  {Function} callback
 * @param  {Mixed}    value
 * @param  {Object}   rule
 */
Validation.addValidator('url', function (callback, value, rule) {
	var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
		'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
		'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
		'(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
		'(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
	if (!pattern.test(value)) {
		return callback('Invalid URL');
	}
	return callback(null);
});

/**
 * Validator: same
 * @param  {Function} callback
 * @param  {Mixed}    value
 * @param  {Object}   rule
 */
Validation.addValidator('same', function (callback, value, rule) {
	if (this.data[rule.field] !== value) {
		return callback('Not the same as ' + rule.field);
	}
	return callback(null);
});

module.exports = Validation;
