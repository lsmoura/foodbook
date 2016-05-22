function getParams() {
	var params = {};
	window.location.search.substr(1).split('&').map(function(x) {
		var aux = x.split('=');
		params[aux[0]] = aux[1];
		return(x);
	});

	return(params);
}

jQuery(document).ready(function() {
	var params = getParams();

	['name', 'email'].forEach(function(x) {
		if (params.hasOwnProperty(x))
			jQuery('#' + x).val(decodeURI(params[x]));
	});

	if (params.hasOwnProperty('message')) {
		jQuery('#messages').append('<p class="bg-info">' + decodeURI(params.message) + '</p>');
	}
});

function json_post(url, payload, callback) {
	jQuery.ajax({
		'url': url,
		'method': 'post',
		'contentType': 'application/json',
		'data': JSON.stringify(payload)
	}).done(callback);
}

function timedMessage(msg, timeout, cssClass) {
	cssClass = cssClass || 'bg-info';
	timeout = timeout || 5000;

	var obj = jQuery('<p/>').html(msg).addClass(cssClass);
	jQuery('#messages').append(obj);
	setTimeout(function() {
		obj.remove();
	}, timeout);
}

function foodbook_init() {
	var myProfile = null;
	var products = [];
	var favorites = [];

	// Hosts only feature
	var myproducts = [];
	var mymatches = [];

	var getProductById = function(id) {
		var product = null;
		var i, l = products.length;
		for (i = 0; i < l; i++)
			if (id == products[i].id) {
				product = products[i];
				break;
			}

		return(product);
	};

	var updateProfileInfo = function() {
		jQuery('#name').val(myProfile.name);
		jQuery('#email').val(myProfile.email);
		jQuery('#zip').val(myProfile.zip);
		jQuery('#description').val(myProfile.description);

		if (myProfile.host) {
			jQuery('.host-only-btn').removeClass('btn-disabled').addClass('btn-default');
			jQuery('body').addClass('host');
		}
	};

	var loadProfile = function(callback) {
		jQuery.ajax('/profile').done(function(data) {
			myProfile = data;
			updateProfileInfo();
			callback && callback(data);
		});
	};

	var buildProfile = function() {
		var ret = {};

		ret.name = jQuery('#name').val();
		ret.email = jQuery('#email').val();
		ret.zip = jQuery('#zip').val();
		ret.description = jQuery('#description').val();

		return(ret);
	}

	var loadProducts = function(callback) {
		jQuery.ajax('/products').done(function(data) {
			products = data;
			console.log(data);

			jQuery('#products-table tbody').html('');

			products.forEach(function(product) {
				var row = jQuery('<tr/>').attr('data-id', product.id).addClass('product').attr('id', 'product-' + product.id);
				row.attr('data-favorite', false);
				var cmd = '<span class="glyphicon glyphicon-star on favorite-toggle"></span>';
				cmd += '<span class="glyphicon glyphicon-star-empty off favorite-toggle"></span>';

				if (myProfile.host) 
					cmd += '<span class="glyphicon glyphicon-plus myproducts-add"></span>';

				row.append('<td>' + cmd + '</td>');
				row.append('<td><span class="name">' + product.name + '</span><div class="description">' + (product.description || 'no descrpition')  + '</div></td>');
				row.append('<td>' + product.code + '</td>');
				row.append('<td>' + product.manufacturer + '</td>');
				row.append('<td>' + product.case_size + '</td>');
				jQuery('#products-table tbody').append(row);
			})

			loadFavorites(callback);
		});
	};

	var loadFavorites = function(callback) {
		var addProduct = function(product_id) {
			var product = getProductById(product_id);

			if (!product)
				return(false);

			var row = jQuery('<tr/>').addClass('product');
			row.append('<td><span class="name">' + product.name + '</span><div class="description">' + (product.description || 'no descrpition')  + '</div></td>');
			row.append('<td>' + product.code + '</td>');
			row.append('<td>' + product.manufacturer + '</td>');
			row.append('<td>' + product.case_size + '</td>');
			jQuery('#wishlist-table tbody').append(row);
		};

		jQuery('#wishlist-table tbody').html('');

		jQuery.ajax('/favorite').done(function(data) {
			console.log(data);
			favorites = data;
			var i, l = favorites.length;
			for (i = 0; i < l; i++) {
				var tr = jQuery('#product-' + favorites[i]);
				tr.addClass('favorite');
				tr.attr('data-favorite', true);
				addProduct(favorites[i]);
			}
		});

		callback && callback();
	};

	var loadMyProducts = function() {
		jQuery.ajax('/myproducts').done(function(data) {
			console.log(data);
			myproducts = data;
			rebuildMyProductsTable();
		});
	};

	var rebuildMyProductsTable = function() {
		var addProduct = function(product_id) {
			var product = getProductById(product_id);

			if (!product)
				return(false);

			var row = jQuery('<tr/>').addClass('product').attr('id', 'myproduct-' + product.id);
			row.append('<td><span class="name">' + product.name + '</span><div class="description">' + (product.description || 'no descrpition')  + '</div></td>');
			row.append('<td>' + product.code + '</td>');
			row.append('<td>' + product.manufacturer + '</td>');
			row.append('<td>' + product.case_size + '</td>');
			row.append('<td><btn class="btn btn-default myproduct-remove" data-id="' + product.id + '">Remove</td>');
			jQuery('#myproducts-table tbody').append(row);
		};

		jQuery('#myproducts-table tbody').html('');

		var i, l = favorites.length;
		for (i = 0; i < l; i++) {
			addProduct(myproducts[i]);
		}
	}

	jQuery('#btn-profile').on('click', function(event) {
		jQuery('#head-menu li').removeClass('active');
		jQuery('#li-profile').addClass('active');
		jQuery('.site-section').hide();
		jQuery('#profile').show();
	});

	jQuery('#btn-products').on('click', function(event) {
		jQuery('#head-menu li').removeClass('active');
		jQuery('#li-products').addClass('active');
		jQuery('.site-section').hide();
		jQuery('#products').show();
	});

	jQuery('#btn-wishlist').on('click', function(event) {
		jQuery('#head-menu li').removeClass('active');
		jQuery('#li-wishlist').addClass('active');
		jQuery('.site-section').hide();
		jQuery('#wishlist').show();
	});
	jQuery('#btn-myproducts').on('click', function(event) {
		jQuery('#head-menu li').removeClass('active');
		jQuery('#li-myproducts').addClass('active');
		jQuery('.site-section').hide();
		jQuery('#myproducts').show();
	});
	jQuery('#btn-wishlist-reload').on('click', function(event) { loadFavorites(); });
	jQuery('#btn-profile-reload').on('click', function(event) { loadProfile(); });
	jQuery('#btn-myproducts-reload').on('click', function(event) { loadMyProducts(); });

	jQuery('#btn-profile-save').on('click', function(event) {
		var obj = buildProfile();

		json_post('/profile', obj, function(data) {
			if (!data.id) {
				console.error("Error updating profile with data: " + JSON.stringify(obj));
				timedMessage('save error.', 5000, 'bg-danger');
				return;
			}
			myProfile = data;
			updateProfileInfo();
			timedMessage('profile saved.');
		});
	});

	jQuery('#products-table').on('click', '.favorite-toggle', function(event) {
		var me = jQuery(this);
		var tr = me.parent().parent();
		var favorite = tr.data('favorite');
		var id = tr.data('id');

		var url = '/favorite/' + ((favorite == false)?'add':'remove') + '/' + id;
		console.log(tr.data('favorite'));
		console.log(url);
		
		jQuery.ajax(url).done(function(data) {
			console.log(data);
			if (!data.product_id) {
				timedMessage('Something went wrong when changing favorite...', 5000, 'bg-danger');
				return;
			}

			tr.data('favorite', data.favorite);
			if (data.favorite)
				tr.addClass('favorite');
			else
				tr.removeClass('favorite');

			if (data.favorite == true) {
				// Add to favorites
				favorites.push(data.product_id);
			}
			else {
				// Remove from favorites
				var idx = favorites.indexOf(data.product_id);
				if (idx > -1)
					favorites.splice(idx, 1);
			}
		});
	});

	jQuery('#products-table').on('click', '.myproducts-add', function(event) {
		var me = jQuery(this);
		var tr = me.parent().parent();
		var id = tr.data('id');

		var product = getProductById(id);

		if (window.confirm("Add product '" + product.name + "'?")) {
			console.log("Adding...");
			jQuery.ajax('/myproducts/add/' + id).done(function(data) {
				if (!data.product_id) {
					timedMessage('Something went wrong when changing myproduct...', 5000, 'bg-danger');
					return;
				}
				myproducts.push(data.product_id);
				rebuildMyProductsTable();
			});
		}
	});

	jQuery('#myproducts-table').on('click', '.myproduct-remove', function(event) {
		var id = jQuery(this).data('id');

		jQuery.ajax('/myproducts/remove/' + id).done(function(data) {
			if (!data.product_id) {
				timedMessage('Something went wrong when changing myproduct...', 5000, 'bg-danger');
				return;
			}

			// Remove from list
			var idx = myproducts.indexOf(id);
			if (idx > -1)
				myproducts.splice(idx, 1);

			jQuery('#myproduct-' + id).remove();
		});
	});

	loadProfile(function(profile) {
		loadProducts(function() {
			if (profile.host) {
				loadMyProducts();
				//loadRequests();
			}
		});
	});
}

