/* global _, KJUR */
'use strict';

var pwc = angular.module('pwc', ['Utils']);

_.contains = function (a, b) {
	return _.includes(a, b);
};

pwc.controller('LoginController', ['$rootScope', '$scope', 'StorageService', '$http',
	function ($rootScope, $scope, StorageService, $http) {
		$scope.showSettings = false;
		$rootScope.error = "";
		var error = "Access denied for this secret key. Check the credentials and try again.";
		var settings = StorageService.get("para-auth") || {};
		var accessKey = settings.accessKey || "";
		var secretKey = settings.secretKey || "";
		var endpoint = settings.endpoint || "https://paraio.com";
		var apiPath = settings.apiPath || "/v1/";
		var remember = settings.remember || false;
		var jwt = settings.jwt || "";

		function getJWT(appid, secret) {
			var now = Math.round(new Date().getTime() / 1000);
			var sClaim = JSON.stringify({
				exp: now + (7 * 24 * 60 * 60),
				iat: now,
				nbf: now,
				appid: appid
			});
			var sHeader = JSON.stringify({'alg': 'HS256', 'typ': 'JWT'});
			return KJUR.jws.JWS.sign(null, sHeader, sClaim, secret);
		}

		function getURL() {
			if (_.endsWith($scope.settings.endpoint, "/")) {
				$scope.settings.endpoint = $scope.settings.endpoint.sustring(0, $scope.settings.endpoint.length - 1);
			}
			if (!_.startsWith($scope.settings.apiPath, "/")) {
				$scope.settings.apiPath = "/" + $scope.settings.apiPath;
			}
			if (!_.endsWith($scope.settings.apiPath, "/")) {
				$scope.settings.apiPath = $scope.settings.apiPath + "/";
			}
			return $scope.settings.endpoint + $scope.settings.apiPath;
		}

		$scope.settings = {
			accessKey: accessKey,
			secretKey: secretKey,
			endpoint: endpoint,
			apiPath: apiPath,
			remember: remember
		};

		$scope.login = function (jwtToken) {
			var token = jwtToken || getJWT($scope.settings.accessKey, $scope.settings.secretKey);

			$http.get(getURL() + "_me", {
				headers: {
					"Authorization": "Bearer " + token
				}
			}).then(function (data) {
				if (data.data && data.data.id) {
					$scope.showSettings = false;
					$rootScope.error = "";
					if (!$scope.settings.remember) {
						delete $scope.settings.secretKey;
					}
					StorageService.save("para-auth", angular.extend($scope.settings, {
						app: data.data,
						jwt: token,
						url: getURL(),
						theme: StorageService.get("para-auth").theme
					}));
					window.location = "./index.html";
				} else {
					$rootScope.error = error;
				}
			}, function (res) {
				$rootScope.error = error;
			});
		};

		if (jwt.length > 1) {
			$scope.login(jwt);
		}
	}
]);