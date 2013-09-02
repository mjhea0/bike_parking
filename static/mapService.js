var MapService = (function(MapService) {	
	var directionsDisplay;
	var directionsService = new google.maps.DirectionsService();
	var map;

	function initializeMap(startLocation, callback) {
		directionsDisplay = new google.maps.DirectionsRenderer();
		var mapOptions = {
			zoom: 17,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		map = new google.maps.Map(document.getElementById('map-canvas'),
		mapOptions);
		directionsDisplay.setMap(map);

		if (!$.isEmptyObject(startLocation)) {
			var latitude = startLocation.latitude;
			var longitude = startLocation.longitude;
			var pos = new google.maps.LatLng(latitude, longitude);

			map.setCenter(pos);
		
			callback({
				'latitude': latitude,
				'longitude': longitude
			});			
		}
		// Try HTML5 geolocation
		else if(navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				var latitude = position.coords.latitude;
				var longitude = position.coords.longitude;
				var pos = new google.maps.LatLng(latitude, longitude);

				map.setCenter(pos);
			
				callback({
					'latitude': latitude,
					'longitude': longitude
				});			
			}, function() {
				handleNoGeolocation(true);
			});
		} else {
			// Browser doesn't support Geolocation
			handleNoGeolocation(false);
		}
	}

	function handleNoGeolocation(errorFlag) {
		if (errorFlag) {
			var content = 'Error: The Geolocation service failed.';
		} else {
			var content = 'Error: Your browser doesn\'t support geolocation.';
		}

		var options = {
			map: map,
			// Display an arbitrary location
			position: new google.maps.LatLng(37.78741, -122.403033),
			content: content
		};

		var infowindow = new google.maps.InfoWindow(options);
		map.setCenter(options.position);
	}

	function calcRoute(startLocation, endLocation) {
		var start = new google.maps.LatLng(startLocation.latitude, startLocation.longitude);
		var end = new google.maps.LatLng(endLocation.latitude, endLocation.longitude);
		var request = {
			origin: start,
			destination: end,
			travelMode: google.maps.DirectionsTravelMode.BICYCLING
		};
		directionsService.route(request, function(resp, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				directionsDisplay.setDirections(resp);
			}
		});
	}
	
	return {
		map: map,
		calcRoute: calcRoute,
		handleNoGeolocation: handleNoGeolocation,
		initializeMap: initializeMap
	};
	
}())