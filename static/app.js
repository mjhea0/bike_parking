function LocationsViewModel() {
	var self = this;
	self.mapService = MapService;
	self.directionsURI = 'http://localhost:5000/api/v1.0/directions';
	self.locations = ko.observableArray();
	self.currentLocation = {};
		
	self.ajax = function(uri, method, data) {
		var request = {
			url: uri,
			type: method,
			contentType: 'application/json',
			accepts: 'application/json',
			cache: false,
			dataType: 'json',
			data: JSON.stringify(data),
			error: function(jqXHR) {
				console.log('ajax error: ' + jqXHR.status);
			}
		};
		return $.ajax(request);
	};
	
	self.beginChange = function() {
		$('#change').modal('show');
	}
	
	self.getDirections = function(location) {
		var endLocation = {
			'latitude': location.latitude(),
			'longitude': location.longitude()
		}
		self.mapService.calcRoute(self.currentLocation, endLocation);
	}
	
	self.changeStarting = function(newLocation) {
		self.mapService.initializeMap(newLocation, initLocations);
	}
	
	function initLocations(currentLocation) {
		self.currentLocation = currentLocation;
		self.ajax(self.directionsURI, 'POST', self.currentLocation).done(function(data) {
			for (var i = 0; i < data.result.length; i++) {
				self.locations.push({
					latitude: ko.observable(data.result[i].latitude),
					longitude: ko.observable(data.result[i].longitude),
					address: ko.observable(data.result[i].location_name),
					racks_installed: ko.observable(data.result[i].racks_installed)
				});
			}
			if (self.locations().length > 0) {
				self.getDirections(self.locations()[0]);
			}
		});
	}
	self.mapService.initializeMap({}, initLocations);
}

function ChangeLocationViewModel() {
	var self = this;
	self.latitude = ko.observable();
	self.longitude = ko.observable();
	self.changeLoc = function() {
		$('#change').modal('hide');
		locationsViewModel.changeStarting({
			'latitude': +self.latitude(),
			'longitude': +self.longitude()
		});
		self.latitude("");
		self.longitude("");
	}
}

var locationsViewModel = new LocationsViewModel();
var changeLocationViewModel = new ChangeLocationViewModel();
ko.applyBindings(locationsViewModel, $('#main')[0]);
ko.applyBindings(changeLocationViewModel, $('#change')[0]);