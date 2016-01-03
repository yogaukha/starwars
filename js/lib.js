var NipJS = (function(){

	function Router(){
		var self = this;

		var routes = [];
		var defaultPath = '/';

		var currentRoute = {};

		// add a route to route list
		self.add = function(route){
			routes.push(route);
			return self;
		}

		// set default path
		self.otherwise = function(path){
			self.defaultPath = path;
			return self;
		}

		//search pattern based on registered route
		self.searchPattern = function(){
			var url = location.hash.slice(1) || '/';
			var found = false;
			
			for(var i=0; i < routes.length;i++){
				var route = routes[i];
				var pattern = getRegex(route.path);

				var result = url.match(pattern);
				if(result !== null){
					var params = result.splice(1,result.length-1);
					
					found = true;
					// route found then apply the controller function
					if(typeof(route.controller) == 'function'){
						route.controller.apply(null, params);
					}else{
						window[route.controller].apply(null, params);
					}
					currentRoute = route;
					break;
				}
			}

			if(!found){
				// not found? redirect to defaultpath
				self.redirect(self.defaultPath);
			}
		}

		// add eventlistener
		self.listen = function(){
			window.addEventListener('hashchange', self.searchPattern);
			window.addEventListener('load', self.searchPattern);
			return self;
		}

		// redirect hash location
		self.redirect = function(path){
			location.hash = path;
		}

		function getRegex(str){
			str += '$';
			var regex = new RegExp(str);
			return regex;
		}

		function trim(x) {
			return x.replace(/^[\s\/]+|[\s\/]+$/gm,'');
		}
	}

	function View(){
		var self = this;
		var mainTheme = 'main-container';

		var cache = {};

		self.setContainer = function(viewId){
			mainTheme = viewId;
		}

		// render view
		self.render = function(viewId, data){
			var theme = document.getElementById(mainTheme);
			var view = document.getElementById(viewId);

			var html = view.innerHTML;
			var template = parseTemplate(html, data);
			theme.innerHTML = template;

			if(typeof(data.afterRender) == 'function'){
				data.afterRender();
			}
		};

		function parseTemplate(html, options){
			var re = /<%([^%>]+)?%>/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = 'var r=[];\n', cursor = 0, match;
			var add = function(line, js) {
				js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
					(code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
				return add;
			}
			while(match = re.exec(html)) {
				add(html.slice(cursor, match.index))(match[1], true);
				cursor = match.index + match[0].length;
			}
			add(html.substr(cursor, html.length - cursor));
			code += 'return r.join("");';
			return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
		}
	}

	function Service(){
		this.get = function(url) {
			var promise = new Promise(function(resolve, reject){
				var request = new XMLHttpRequest();
			    request.open('GET', url);

			    request.onload = function(){
			    	if(request.status == 200){
			    		resolve(request.response);
			    	}else{
			    		reject(Error(request.statusText));
			    	}
			    };

			    request.onerror = function(){
			    	reject(Error('Error fetching data.'));
			    }

			    window.addEventListener('hashchange', function(){ request.abort()});

			    request.send();
			});

			return promise;
		}

	}

	function Cache(){
		var data = [];

		this.set = function(key, value){
			data[key] = value;
		}
		this.get = function(key, defaultValue){
			if(typeof(data[key]) != 'undefined')
				return data[key];
			else
				return defaultValue;
		}
	}

	function start(){
		var router = new Router();
		var view = new View();
		var service = new Service();
		var cache = new Cache();
		
		return {
			router: router,
			view:view,
			service:service,
			cache:cache
		}
	}

	return {
		start:start
	}

}());