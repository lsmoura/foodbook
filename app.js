'use strict';

var fs = require('fs');
var path = require('path');
var dispatch = require('dispatchjs');
var moment = require('moment');
var async = require('async');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('foodbook.db');


dispatch.setOption('debug', true);

//var stmt = db.prepare("UPDATE users SET created = ?, modified = ? WHERE 1");
//var now = moment().format('YYYY-MM-DD HH:mm:ss');
//stmt.run(now, now);
//stmt.finalize();


/*
var stmt = db.prepare("UPDATE products SET created = ?, modified = ? WHERE 1");
var now = moment().format('YYYY-MM-DD HH:mm:ss');
stmt.run(now, now);
stmt.finalize();
*/

/*
db.each("SELECT * FROM users", function(err, row) {
	if (err) throw(err);
	console.log(row);
});
*/

function redirect(res, dest, finish) {
	if (finish === undefined)
		finish = true;

	res.setHeader('Location', dest);
	res.writeHead(302);
	if (finish) res.end();
}

function parseCookies(cookieStr) {
	var cookie_aux = cookieStr.split(';');
	var cookies = {};
	cookie_aux.forEach(function(x) {
		x = x.trim();
		var idx = x.indexOf('=');
		var key = x.substr(0, idx);
		var value = x.substr(idx+1);
		cookies[key] = value;
	});

	return(cookies);
}

function getUserById(id, callback) {
	db.get("SELECT * FROM users WHERE id = ?", id, function(err, row) {
		if (err)
			return(setImmediate(callback, err));

		if (row === undefined) {
			return(setImmediate(callback, 'no such user: ' + id));
		}
		return(setImmediate(callback, null, row));
	});	
}

function getUser(cookieStr, callback) {
	if (!cookieStr)
		return(setImmediate(callback, 'no cookie string.'));

	var cookies = parseCookies(cookieStr);

	if (cookies.hasOwnProperty('user') === false)
		return(setImmediate(callback, 'no user information'));

	getUserById(cookies.user, callback);
}

dispatch.map('GET', '/$', function(ret, res) {
	// Check login
	var cookie = null;
	if (this.headers.hasOwnProperty('cookie'))
		cookie = this.headers.cookie;

	if (cookie == null) {
		redirect(res, '/login.html');
		return;
	}
	var cookies = parseCookies(cookie);

	if(cookies.hasOwnProperty('user') === false) {
		redirect(res, '/login.html');
		return;
	}

	var self = this;

	// Load user
	db.get("SELECT * FROM users WHERE id = ?", cookies.user, function(err, row) {
		if (err || row === undefined) {
			redirect(res, '/login.html');
			return;
		}

		console.log(row);

		fs.readFile(path.join(__dirname, 'index.html'), 'utf-8', function(err, data) {
			self(data, { 'Content-Type': 'text/html' });
		});
	});

});

dispatch.map('GET', '/logout', function(ret, res) {
	res.setHeader('Set-Cookie', 'user=');
	redirect(res, '/login.html');
});

// Retrieve user profile
dispatch.map('GET', '/profile', function(ret, res) {
	var self = this;

	// Check login
	var cookie = '';
	if (this.headers.hasOwnProperty('cookie'))
		cookie = this.headers.cookie;

	getUser(cookie, function(err, profile) {
		if (err) {
			console.error(err);
			self('{}', { 'Content-Type': 'application/json' });
			return;
		}

		delete(profile.password);
		self(JSON.stringify(profile), { 'Content-Type': 'application/json' });
	});
});

dispatch.map('POST', '/profile', function(ret, res) {
	var self = this;

	// Check login
	var cookie = '';
	if (this.headers.hasOwnProperty('cookie'))
		cookie = this.headers.cookie;

	getUser(cookie, function(err, profile) {
		if (err) {
			console.error(err);
			self('{}', { 'Content-Type': 'application/json' });
			return;
		}

		var db_data = [ self.fields.name, self.fields.email, self.fields.description, self.fields.zip, profile.id ];
		console.log(db_data);

		db.run('UPDATE users SET name = ?, email = ?, description = ?, zip = ? WHERE id = ?', 
			db_data,
			function(err) {
				if (err) {
					console.error(err);
					self('{}', { 'Content-Type': 'application/json' });
					return;
				}
				getUser(cookie, function(err, profile) {
					if (err) {
						console.error(err);
						self('{}', { 'Content-Type': 'application/json' });
						return;
					}
					self(JSON.stringify(profile), { 'Content-Type': 'application/json' });
				});
			}
		);
	});
});

dispatch.map('POST', '/login', function(ret, res) {
	var self = this;
	console.log(this.fields);

	db.get("SELECT * FROM users WHERE password = ? AND email = ?", [ this.fields.password, this.fields.email ], function(err, row) {
		if (err) throw(err);

		if (row === undefined) {
			redirect(res, '/login.html?message=' + encodeURI('Invalid user/password'));
		}
		else {
			res.setHeader('Set-Cookie', 'user=' + row.id);
			redirect(res, '/');
		}
	});
});

dispatch.map('POST', '/register', function(ret, res) {
	var self = this;
	console.log(this.fields);

	var now = moment().format('YYYY-MM-DD HH:mm:ss');
	db.run('INSERT INTO users (created, modified, name, email, password) VALUES(?, ?, ?, ?, ?)', [now, now, this.fields.name, this.fields.email, this.fields.password ], function(err) {
		if (err) {
			console.error(err);
			redirect(res, '/register.html?message=' + encodeURI("Cannot register your account.") + '&email=' + encodeURI(self.fields.email) + '&name=' + encodeURI(self.fields.name));
			return;
		}

		console.log(this);

		res.setHeader('SetCookie', 'user=' + this.lastID);
		redirect(res, '/');
	});
});

dispatch.map('GET', '/products$', function(ret, res) {
	var self = this;

	// Check login
	var cookie = '';
	if (this.headers.hasOwnProperty('cookie'))
		cookie = this.headers.cookie;

	getUser(cookie, function(err, profile) {
		if (err) {
			console.error(err);
			self('{}', { 'Content-Type': 'application/json' });
			return;
		}

		db.all('SELECT * FROM products', function(err, rows) {
			if (err) {
				console.error(err);
				self('{}', { 'Content-Type': 'application/json' });
			}

			self(JSON.stringify(rows), { 'Content-Type': 'application/json' });
		})
	});
});

dispatch.map('POST', '/products/new$', function(ret, res) {
	var self = this;

	// Check login
	var cookie = '';
	if (this.headers.hasOwnProperty('cookie'))
		cookie = this.headers.cookie;

	getUser(cookie, function(err, profile) {
		if (err) {
			console.error(err);
			self('{}', { 'Content-Type': 'application/json' });
			return;
		}

		var now = moment().format('YYYY-MM-DD HH:mm:ss');
		var fields = [
			now,
			now,
			self.fields.name,
			self.fields.code,
			self.fields.manufacturer,
			self.fields.case_size,
			self.fields.description
		];

		db.run('INSERT INTO products (created, modified, name, code, manufacturer, case_size, description) VALUES (?, ?, ?, ?, ?, ?, ?)', fields, function(err, rows) {
			if (err) {
				console.error(err);
				self('{}', { 'Content-Type': 'application/json' });
			}

			var obj = {
				id: this.lastID,
				created: now,
				modified: now,
				name: self.fields.name,
				code: self.fields.code,
				manufacturer: self.fields.manufacturer,
				case_size: self.fields.case_size,
				description: self.fields.description
			};

			self(JSON.stringify(obj), { 'Content-Type': 'application/json' });
		})
	});
});

dispatch.map('GET', '/favorite$', function(ret, res) {
	var self = this;

	// Check login
	var cookie = '';
	if (this.headers.hasOwnProperty('cookie'))
		cookie = this.headers.cookie;

	getUser(cookie, function(err, profile) {
		if (err) {
			console.error(err);
			self('{}', { 'Content-Type': 'application/json' });
			return;
		}

		db.all('SELECT * FROM wishlist WHERE user_id = ?', profile.id, function(err, rows) {
			if (err) {
				console.error(err);
				self('{}', { 'Content-Type': 'application/json' });
			}

			var ret = [];
			rows.forEach(function(row) {
				ret.push(row.product_id);
			});

			self(JSON.stringify(ret), { 'Content-Type': 'application/json' });
		})
	});
});

dispatch.map('GET', '/favorite/add/([0-9]*)$', function(ret, res) {
	var self = this;
	console.log(this.matches);
	var id = this.matches[1];

	// Check login
	var cookie = '';
	if (this.headers.hasOwnProperty('cookie'))
		cookie = this.headers.cookie;

	getUser(cookie, function(err, profile) {
		if (err) {
			console.error(err);
			self('{}', { 'Content-Type': 'application/json' });
			return;
		}

		db.all('SELECT * FROM wishlist WHERE user_id = ?', profile.id, function(err, rows) {
			if (err) {
				console.error(err);
				self('{}', { 'Content-Type': 'application/json' });
			}

			// Check if we already have this product on our wishlist
			var has = false;
			rows.forEach(function(row) {
				if (row.product_id == id) {
					has = true;
				}
			});

			if (has) {
				self(JSON.stringify({ product_id: id, favorite: true }), { 'Content-Type': 'application/json' });
			}
			else {
				db.run('INSERT INTO wishlist (user_id, product_id, amount) VALUES (?, ?, 1)', [profile.id, id], function(err) {
					if (err) {
						console.error(err);
						self('{}', { 'Content-Type': 'application/json' });
					}
					self(JSON.stringify({ product_id: id, favorite: true }), { 'Content-Type': 'application/json' });
				});
			}
		});
	});
});

dispatch.map('GET', '/favorite/remove/([0-9]*)$', function(ret, res) {
	var self = this;
	console.log(this.matches);
	var id = this.matches[1];

	// Check login
	var cookie = '';
	if (this.headers.hasOwnProperty('cookie'))
		cookie = this.headers.cookie;

	getUser(cookie, function(err, profile) {
		if (err) {
			console.error(err);
			self('{}', { 'Content-Type': 'application/json' });
			return;
		}

		db.run('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [ profile.id, id ], function(err) {
			if (err) {
				console.error(err);
				self('{}', { 'Content-Type': 'application/json' });
			}

			self(JSON.stringify({ product_id: id, favorite: false }), { 'Content-Type': 'application/json' });
		});
	});
});

dispatch.map('GET', '/myproducts$', function(ret, res) {
	var self = this;

	console.log(this.matches);
	var id = this.matches[1];

	// Check login
	var cookie = '';
	if (this.headers.hasOwnProperty('cookie'))
		cookie = this.headers.cookie;

	getUser(cookie, function(err, profile) {
		if (err) {
			console.error(err);
			self('[]', { 'Content-Type': 'application/json' });
			return;
		}

		db.all('SELECT * FROM user_products WHERE user_id = ?', [ profile.id ], function(err, rows) {
			if (err) {
				console.error(err);
				self('{}', { 'Content-Type': 'application/json' });
			}

			var ret = [];
			rows.forEach(function(row) {
				ret.push(row.product_id);
			});

			self(JSON.stringify(ret), { 'Content-Type': 'application/json' });
		});
	});	
});

dispatch.map('GET', '/myproducts/add/([0-9]*)$', function(ret, res) {
	var self = this;
	console.log(this.matches);
	var id = this.matches[1];

	// Check login
	var cookie = '';
	if (this.headers.hasOwnProperty('cookie'))
		cookie = this.headers.cookie;

	getUser(cookie, function(err, profile) {
		if (err) {
			console.error(err);
			self('{}', { 'Content-Type': 'application/json' });
			return;
		}

		db.all('SELECT * FROM user_products WHERE user_id = ?', profile.id, function(err, rows) {
			if (err) {
				console.error(err);
				self('{}', { 'Content-Type': 'application/json' });
			}

			// Check if we already have this product on our user_products
			var has = false;
			rows.forEach(function(row) {
				if (row.product_id == id) {
					has = true;
				}
			});

			if (has) {
				self(JSON.stringify({ product_id: id, available: true }), { 'Content-Type': 'application/json' });
			}
			else {
				db.run('INSERT INTO user_products (user_id, product_id, amount) VALUES (?, ?, 1)', [profile.id, id], function(err) {
					if (err) {
						console.error(err);
						self('{}', { 'Content-Type': 'application/json' });
					}
					self(JSON.stringify({ product_id: id, available: true }), { 'Content-Type': 'application/json' });
				});
			}
		});
	});
});

dispatch.map('GET', '/myproducts/remove/([0-9]*)$', function(ret, res) {
	var self = this;
	console.log(this.matches);
	var id = this.matches[1];

	// Check login
	var cookie = '';
	if (this.headers.hasOwnProperty('cookie'))
		cookie = this.headers.cookie;

	getUser(cookie, function(err, profile) {
		if (err) {
			console.error(err);
			self('{}', { 'Content-Type': 'application/json' });
			return;
		}

		db.run('DELETE FROM user_products WHERE user_id = ? AND product_id = ?', [ profile.id, id ], function(err) {
			if (err) {
				console.error(err);
				self('{}', { 'Content-Type': 'application/json' });
			}

			self(JSON.stringify({ product_id: id, available: false }), { 'Content-Type': 'application/json' });
		});
	});
});

dispatch(3000, { serve_static: true });
