/* global _, authObject, actions */
'use strict';

var pwc = angular.module('pwc', ['ng-admin', 'restangular', 'Utils']);

_.contains = function (a, b) {
	return _.includes(a, b);
};

_.upperFirst = function (str) {
	var string = str || "";
	var chr = string.charAt(0);
	return chr ? chr.toUpperCase()  + string.slice(1) : str;
};

pwc.controller('MainController', ['$rootScope', '$scope',
	function($rootScope, $scope) {
		$scope.authObject = authObject || {};
	}
]);

pwc.config(['NgAdminConfigurationProvider', 'RestangularProvider',
	function (NgAdminConfigurationProvider, RestangularProvider) {
		if (!authObject || !authObject.jwt) return;
		var nga = NgAdminConfigurationProvider;
		var appName = authObject.app.name || "Para Web Console";
		var appid = authObject.accessKey || "";
		var limit = 30;

		RestangularProvider.setDefaultHeaders({'Authorization': 'Bearer ' + authObject.jwt});

		RestangularProvider.addFullRequestInterceptor(function (element, operation, what, url, headers, params) {
			if (operation === "getList") {
				if (params._page) {
					params.limit = limit;
					params.page = params._page;
				}
				if (params._sortField) {
					params.sort = params._sortField;
					params.desc = params._sortDir === 'DESC';
				}
				if (params._filters) {
					params.q = params._filters.q || '*';
					delete params._filters.q;
					var filterz = [];
					for (var filter in params._filters) {
						filterz.push(filter + ":" + params._filters[filter]);
					}
					filterz.push(params.q);
					params.q = _.join(filterz, ' AND ');
				}
				delete params._page;
				delete params._perPage;
				delete params._sortField;
				delete params._sortDir;
				delete params._filters;
			} else if (operation === 'patch' && what === 'app' && element.id === authObject.app.id) {
				authObject.app = element;
				saveAuth(authObject);
			}
			return {params: params};
		});

		RestangularProvider.addResponseInterceptor(function (data, operation, what, url, response, deferred) {
			if (data && _.isObject(data) && data.items) {
				response.totalCount = data.totalHits || data.items.length;
				return data.items;
			}
			return data;
		});

		RestangularProvider.setErrorInterceptor(function (response, deferred, responseHandler) {
			if (response.status === 403 || response.status === 401) {
				logout();
				return false;
			}
			return true;
		});

		var admin = nga.application(appName + " - " + appid, false).baseApiUrl(authObject.url);
		var apps = nga.entity('app');
		var addresses = nga.entity('address');
		var linkers = nga.entity('linker');
		var tags = nga.entity('tag');
		var users = nga.entity('user');
		//var votes = nga.entity('vote');
		var sysprops = nga.entity('sysprop');

		function truncate(value) {
			if (!value) {
				return '';
			}
			return value.length > 50 ? value.substr(0, 50) + '...' : value;
		}

		function getPic(size) {
			return nga.field('picture', 'template').label('').
						template('<img src="{{entry.values.picture}}" width="' + size + '" />');
		}

		function crudify(entity, type, readOnly) {
			readOnly = readOnly || false;
			var isUser = type === 'user';
			var idp = nga.field('identityProvider').label('Logged in with');
			var email = nga.field('email', 'template').
						template('<a href="mailto:{{entry.values.email}}">{{entry.values.email}}</a>');

			entity.listView().perPage(limit).fields([
				isUser ? getPic(20) : nga.field('id').isDetailLink(true),
				nga.field('name').isDetailLink(true),
				nga.field('timestamp', 'datetime').label('Created'),
				nga.field('updated', 'datetime').label('Updated'),
				isUser ? idp : nga.field('creatorid', 'reference').
						label('Created by').
						targetEntity(nga.entity('user')).
						targetField(nga.field('id')),
				isUser ? email : nga.field('tags', 'reference_many').
						targetEntity(nga.entity('tag')).
						targetField(nga.field('tag')).
						singleApiCall(function(ids){ return {'id': ids }; }),
				nga.field('stored', 'boolean'),
				nga.field('indexed', 'boolean'),
				nga.field('cached', 'boolean')
			]).
				listActions(['show', 'edit', 'delete']).
				exportFields([entity.listView().fields()]).
				filters([
					nga.field('q').label('').pinned(true).
							template('<div class="input-group">\n\
								<input type="text" ng-model="value" placeholder="Search" class="form-control"/>\n\
								<span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span></div>'
							),
					nga.field('creatorid', 'reference')
							.targetEntity(nga.entity('user'))
							.targetField(nga.field('name'))
							.label('Created by')
				]);

			if (isUser) {
				var emailInput = nga.field('email', 'email').validation({required: true, minlength: 3});
				var picInput = nga.field('picture').attributes({ placeholder: 'http://' }).label('Avatar URL');
				entity.showView().fields().push(getPic(250));
				entity.showView().fields().push(idp);
				entity.showView().fields().push(email);

				entity.creationView().fields().push(picInput);
				entity.creationView().fields().push(emailInput);
				entity.editionView().fields().push(getPic(250));
			}

			entity.showView().title(_.upperFirst(type) + " #{{entry.values.id}}").fields([
				nga.field('id').isDetailLink(true),
				nga.field('name'),
				nga.field('timestamp', 'datetime').label('Created'),
				nga.field('updated', 'datetime').label('Updated'),
				nga.field('creatorid', 'reference').
						label('Created by').
						targetEntity(nga.entity('user')).
						targetField(nga.field('name')),
				nga.field('tags', 'reference_many').
						targetEntity(nga.entity('tag')).
						targetField(nga.field('tag')),
				nga.field('stored', 'boolean'),
				nga.field('indexed', 'boolean'),
				nga.field('cached', 'boolean'),
				nga.field('').label('JSON').template('<pre>{{entry.values | json}}</pre>')
			]);

			if (!readOnly) {
				entity.creationView().
					title('New ' + _.upperFirst(type)).
					fields([
						nga.field('id').attributes({ placeholder: 'Auto-generated' }),
						nga.field('name').validation({required: true, minlength: 1}),
						nga.field('parentid'),
						nga.field('creatorid', 'reference').
								label('Created by').
								targetEntity(nga.entity('user')).
								targetField(nga.field('id')),
						nga.field('tags', 'reference_many').
								targetEntity(nga.entity('tag')).
								targetField(nga.field('tag')).
								attributes({placeholder: 'Select tags...'}).
								remoteComplete(true, {
									refreshDelay: 300,
									searchQuery: function(search){
										return {q: search};
									}
								})
					]);

				entity.editionView().
					title('Edit ' + _.upperFirst(type) + ' "{{ entry.values.name }}"').
					actions(['list', 'show', 'delete']).
					fields([
						entity.creationView().fields()
					]);
			}

			if (type === 'app') {
				var permissions = nga.field('resourcePermissions', 'json').label('Resource Permissions');
				var constraints = nga.field('validationConstraints', 'json').label('Validation Constraints');
				var datatypes = nga.field('datatypes', 'json').label('Datatypes');
				entity.editionView().fields()[0].
						attributes({ placeholder: 'App identifier' }).
						validation({required: true});
				entity.editionView().fields().push(permissions);
				entity.editionView().fields().push(constraints);
				entity.editionView().fields().push(datatypes);

				entity.creationView().fields().push(permissions);
				entity.creationView().fields().push(constraints);
				entity.creationView().fields().push(datatypes);
			}

			entity.creationView().fields().push(nga.field('votes', 'number'));
			entity.creationView().fields().push(nga.field('stored', 'boolean').validation({required: true}).defaultValue(true));
			entity.creationView().fields().push(nga.field('indexed', 'boolean').validation({required: true}).defaultValue(true));
			entity.creationView().fields().push(nga.field('cached', 'boolean').validation({required: true}).defaultValue(true));

			entity.updateMethod('patch');
			return entity;
		}

		function dashboard() {
			return nga.dashboard().
					addCollection(nga.collection(users).
							name('usersDash').
							title('Recent Users').
							fields([
								nga.field('picture', 'template').label('').
										template('<img src="{{entry.values.picture}}" width="20" />'),
								nga.field('name').isDetailLink(true),
								nga.field('updated', 'datetime').label('Last seen'),
								nga.field('identityProvider').label('Logged in with'),
								nga.field('active', 'boolean')
							]).
							sortField('timestamp').
							sortDir('DESC').
							perPage(15)
							).addCollection(nga.collection(apps).
					name('appsDash').
					title('Recent Apps').
					fields([
						nga.field('name').isDetailLink(true),
						nga.field('id').label('App id'),
						nga.field('active', 'boolean')
					]).
					sortField('timestamp').
					sortDir('DESC').
					perPage(15)
					).addCollection(nga.collection(tags).
					name('tagsDash').
					title('Top Tags').
					fields([
						nga.field('tag', 'template').
								template('<span class="label label-default">{{entry.values.tag}}</span>'),
						nga.field('id').label('Tag id'),
						nga.field('count').label('Tagged objects')
					]).
					sortField('count').
					sortDir('DESC').
					perPage(15)
					).template('<custom-dash></custom-dash>\n\
				<div class="row dashboard-content">\n\
					<div class="col-lg-6">\n\
						<div class="panel panel-default">\n\
							<ma-dashboard-panel collection="dashboardController.collections.usersDash"\n\
								entries="dashboardController.entries.usersDash" datastore="dashboardController.datastore">\n\
							</ma-dashboard-panel>\n\
						</div>\n\
					</div>\n\
					<div class="col-lg-6">\n\
						<div class="panel panel-default">\n\
							<ma-dashboard-panel collection="dashboardController.collections.appsDash"\n\
								entries="dashboardController.entries.appsDash" datastore="dashboardController.datastore">\n\
							</ma-dashboard-panel>\n\
						</div>\n\
						<div class="panel panel-default">\n\
							<ma-dashboard-panel collection="dashboardController.collections.tagsDash"\n\
								entries="dashboardController.entries.tagsDash" datastore="dashboardController.datastore">\n\
							</ma-dashboard-panel>\n\
						</div>\n\
					</div>\n\
				</div>');
		}

		admin.addEntity(crudify(apps, 'app'));
		admin.addEntity(crudify(users, 'user'));
		admin.addEntity(crudify(tags, 'tag'));
		admin.addEntity(crudify(addresses, 'address'));
		admin.addEntity(crudify(sysprops, 'sysprop'));
		admin.addEntity(crudify(linkers, 'linker', true).readOnly());
		//admin.addEntity(crudify(votes, 'vote', true).readOnly());

		for (var ctype in authObject.app.datatypes) {
			var type = authObject.app.datatypes[ctype];
			admin.addEntity(crudify(nga.entity(type), type));
		}

		admin.dashboard(dashboard(nga, users, apps, tags));

		nga.configure(admin);
	}]);


pwc.directive('customDash', ['Restangular', function (Restangular) {
		return {
			restrict: 'E',
			scope: {},
			link: function($scope) {
				$scope.paraVersion = "";
				$scope.totalObjects = 0;
				$scope.totalUsers = 0;
				$scope.appid = authObject.app.id;
				$scope.paraEndpoint = authObject.url;
				$scope.customTypes = _.size(authObject.app.datatypes);
				$scope.totalPermits = _.size(authObject.app.resourcePermissions);

				Restangular.oneUrl('paraVersion', authObject.url).get().then(function (data) {
					$scope.paraVersion = data.data.version;
				});

				Restangular.oneUrl('totalObjects', authObject.url + "search/count").get().then(function (data) {
					$scope.totalObjects = data.totalCount;
				});

				Restangular.oneUrl('totalUsers', authObject.url + "search/count?type=user").get().then(function (data) {
					$scope.totalUsers = data.totalCount;
				});
			},
			templateUrl: '/dash.html'
		};
}]);
