var app = NipJS.start();
var apiUrl = 'http://swapi.co/api/';

// setup route list
app.router
.add({
	name: 'detailRoute',
	path: '/data/([a-zA-Z0-9]*)/([0-9]*)/',
	controller: 'DetailController',
})
.add({
	name: 'dataRoute',
	path: '/data/([a-zA-Z0-9]*)/',
	controller: 'DataController',
})
.add({
	name: 'reviewRoute',
	path: '/review/',
	controller: 'ReviewController',
})
.add({
	name: 'homeRoute',
	path: '/',
	controller: 'HomeController',
})
.otherwise('/')
.listen();

function HomeController(){
	// get data from cache
	var scope = app.cache.get('home', {});

	// get data from api
	app.service.get(apiUrl).then(function(response){
		var data = JSON.parse(response);
		scope.data = data;

		app.view.render('home', scope);
		app.cache.set('home', scope);
	}, function(){
		console.log("error");
	});

	// render view
	app.view.render('home', scope);
}

function DataController(type){
	var button, loading;
	var body = document.body;
	var html = document.documentElement;

	// get data from cache
	var scope = app.cache.get('data-'+type, {});
	var defaults = {
		data: [],
		type: type,
		nextUrl: apiUrl + type + '/',
		loading: false
	};
	// set default value to scope variable
	scope = Helper.extend(defaults, scope);
	
	function getData(){
		if(scope.loading || scope.nextUrl == null) return;
		scope.loading = true;
		app.view.render('data', scope);

		// get data from api
		app.service.get(scope.nextUrl).then(function(response){
			var data = JSON.parse(response);

			// push object to scope.data
			data.results.map(function(val){
				scope.data[val.name||val.title] = val;
			});

			// set nextUrl value
			scope.nextUrl = data.next;
			scope.loading = false;

			app.view.render('data', scope);
			app.cache.set('data-'+type, scope);

			bindButton();
		}, function(){
			console.log("error");
		});
	}

	// bind button next click
	function bindButton(){
		button = document.getElementById('btn-infinite');
		loading = document.getElementById('loading-progress');
		
		button.className = '';
		loading.className = 'hide';

		button.removeEventListener('click');
		button.addEventListener('click', function(e){
			e.preventDefault();
			loading.className = '';
			button.className = 'hide';
			getData();
		});

		bindScroll();
	}

	// bind scroll event for infinite scroll
	function bindScroll(){
		var docHeight = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );
		
		var scrollTop = window.scrollY;
		var deviceHeight = window.innerHeight;
		var height = (docHeight - deviceHeight);
		height = height - (height*2/100);

		// trigger button click event on bottom page
		if(scrollTop > height || (scrollTop==0 && height==0)){
			button.click();
		}
	}
	
	app.view.render('data', scope);
	bindButton();

	// unbind and bind onscroll event
	window.onhashchange = function(){
		window.onscroll = null;
	};
	window.onscroll = bindScroll;
}

function DetailController(type, id){
	// get data from cache
	var scope = app.cache.get('detail-'+type+'-'+id, {});

	// get data from api
	app.service.get(apiUrl+type+'/'+id+'/').then(function(response){
		var data = JSON.parse(response);
		scope.data = data;

		app.view.render('detail', scope);
		app.cache.set('detail-'+type+'-'+id, scope);
	}, function(){
		console.log("error");
	});

	// render view
	app.view.render('detail', scope);
}

function ReviewController(){
	var scope = {
		data:[],
		movies: [],
		profile: false
	};

	// check login status
	scope.profile = Fire.check();

	// set callback after view rendered
	scope.afterRender = afterRender;
	app.view.render('review', scope);

	// listen child_added firebase
	Fire.ref.on('child_added', function(snapshot){
		var obj = snapshot.val();
		scope.data.push(obj);

		app.view.render('review', scope);
	});

	function afterRender(){
		var button = document.getElementById('btn-review');
		var textarea = document.getElementById('message');
		
		if(button){
			// bind button submit review click
			button.addEventListener('click', function(e){
				e.preventDefault();
				var message = textarea.value;
				
				if(message == ''){
					alert('Please fill the input below');
				}else{
					// collect data	
					var data = {
						uid: scope.profile.uid,
						displayName: scope.profile.displayName,
						profileImageURL: scope.profile.profileImageURL,
						message: message,
						date: Date.now()
					}

					// push new data to firebase
					Fire.ref.push(data);

					textarea.value="";
					var whiteboard = document.getElementById('whiteboard');
					whiteboard.scrollTop = whiteboard.scrollHeight;
				}
			});
		}
		
		var btnLogin = document.getElementById('btn-login');
		if(btnLogin){
			// bind login button event
			btnLogin.addEventListener('click', function(e){
				e.preventDefault();
				// login with google account
				Fire.login('google', function(error, authData){
					if(error){
						alert('Login failed');
					}else{
						scope.profile = Fire.check();
						app.view.render('review', scope);
					}
				});
			});
		}

		var btnLogout = document.getElementById('btn-logout');
		if(btnLogout){
			// bind logout button
			btnLogout.addEventListener('click', function(e){
				e.preventDefault();
				// logout
				Fire.logout(function(){
					scope.profile = false;
					app.view.render('review', scope);
				});
			});
		}		
	}
}