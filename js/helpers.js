var Helper = (function(){
	this.getCleanUrl = function(url){
		url = url.replace(apiUrl, '');
		return '#/data/'+url;
	}

	this.labelize = function(value){
		value = value.replace('_', ' ');
		value = this.ucwords(value);
		return value;
	}
	
	this.ucfirst = function(value){
		return value.charAt(0).toUpperCase() + value.slice(1);
	}
	
	this.ucwords = function(str){
		//  discuss at: http://phpjs.org/functions/ucwords/
		return (str + '')
			.replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function($1) {
				return $1.toUpperCase();
			});
	}
	
	this.extend = function(obj, src) {
		for (var key in src) {
			if (src.hasOwnProperty(key)) obj[key] = src[key];
		}
		return obj;
	}

	return this;
}());

var Fire = (function(){
	var fireUrl = "https://amru.firebaseio.com/review";
	var data = false;

	this.ref = new Firebase(fireUrl);
	
	// create a callback which logs the current auth state
	function authDataCallback(authData) {
		if (authData) {
			data = authData;
		}
	}

	function authHandler(error, authData) {
		if (error) {
			return false;
		} else {
			return true;
		}
	}
	ref.onAuth(authDataCallback);

	// check login status
	this.check = function(){
		var profile = data[data.provider];
		if(typeof(profile) == 'undefined'){
			return false;
		}
		profile.uid = data.uid;
		return profile;
	}

	// login
	this.login = function(provider, callback){
		callback = callback || authHandler;
		provider = provider || 'google';
		ref.authWithOAuthPopup(provider, callback);
	}

	// logout
	this.logout = function(callback){
		this.ref.unauth();
		callback();
	}

	return this;
}())