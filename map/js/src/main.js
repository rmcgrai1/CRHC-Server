var CRHC = {
	COLORS: {
		BLUE_LIGHT: '#bce6fb',
		RED: '#9e0b0f',
		BLACK: '#000000'
	}
};

var $divMap = $("<div>", {
		id: "map",
		height: "100%"
	}).appendTo(document.body);

var geocoder;
var GLOC_API_KEY = "AIzaSyDzxVWBC0633xR7O5oifbni4jt1zvtqoaI";
var GMAP_API_KEY = "AIzaSyAHhNGKbSUhI7dIsemU5jYO_ZmXJxgjOmk";

var getUrlParameter = function getUrlParameter(sParam) {
	var sPageURL = decodeURIComponent(window.location.search.substring(1)),
		sURLVariables = sPageURL.split('&'),
		sParameterName,
		i;

	for (i = 0; i < sURLVariables.length; i++) {
		sParameterName = sURLVariables[i].split('=');

		if (sParameterName[0] === sParam) {
			return sParameterName[1] === undefined ? true : sParameterName[1];
		}
	}
};

function loadGoogleScripts() {
	// Load
	$.getScript("https://maps.googleapis.com/maps/api/js?key=" + GMAP_API_KEY + "&callback=initMap");
}

function getLocation(callback) {
	if(location.protocol === 'https:') {
		navigator.geolocation.getCurrentPosition(function(location) {
			callback({lat:location.coords.latitude, lng:location.coords.longitude});
		});
	}
	else {
		$.post("https://www.googleapis.com/geolocation/v1/geolocate?key=" + GLOC_API_KEY, "", function(data) {
			callback(data.location);
		});
	}
}

var infowindow;
var map, maxZoom = 16, minZoom = 14, startZoom = (maxZoom+minZoom)/2, fillWeight = 3.34, strokeWeight = 8;

function zoomFrac(currentZoom, startZoom) {
	var diff = currentZoom - startZoom;

	return Math.pow(0.5, -diff);
}

var myLocation;

var directionsService;
var directionsRenderer;

var uiSettings;

function initMap() {
	geocoder = new google.maps.Geocoder();
	infowindow = new google.maps.InfoWindow();

	$.getJSON("style.json", function(json) {
		getLocation(function(location) {
			myLocation = location;

			var lng, lat;
			lng = getUrlParameter('lng');
			lat = getUrlParameter('lat');
			window.map = new google.maps.Map($divMap.get(0), {
				zoom: startZoom,
				center: location,

				mapTypeControl: false,
				streetViewControl: false,

				styles: json
			});

			loadLandmarks();

			google.maps.event.addListener(window.map, 'click', function() {
				infowindow.close();
			});

			if (lng !== null && lat !== null) {
				dest = new google.maps.LatLng(lat, lng);

				var polylineOptionsActual = new google.maps.Polyline({
					strokeColor: CRHC.COLORS.RED,
					strokeOpacity: 1.0,
					strokeWeight: 10
				});
				directionsRenderer = new google.maps.DirectionsRenderer({
					map: window.map,
					polylineOptions: polylineOptionsActual,
					suppressMarkers: true
				});

				directionsService = new google.maps.DirectionsService();
				directionsService.route({
					origin: location,
					destination: dest,
					travelMode: 'DRIVING'
				}, function(response, status) {
					if (status == "OK") {
						directionsRenderer.setDirections(response);

						var route = response.routes[0].legs[0];

						var startPoint, endPoint;
						startPoint = route.steps[0].start_point;
						endPoint = route.steps[route.steps.length-1].end_point;

						// Add marker:
						var startMarker = new google.maps.Marker({
							position: startPoint, text: 'A'
						});

						var endMarker = new google.maps.Marker({
							position: endPoint, text: 'B'
						});

						endMarker = createMapMarker({
							position: endPoint,
						});
					}
				});
			}

			window.map.addListener('zoom_changed', function() {
				var zoom = window.map.getZoom();

				if(zoom > maxZoom) {
					window.map.setZoom(zoom = maxZoom);
				}
				if(zoom < minZoom) {
					window.map.setZoom(zoom = minZoom);
				}

				var frac = zoomFrac(zoom, maxZoom);

				// Set line weights.
				// Set fill weight.
				setStyler('road.highway', 'geometry.fill', 'weight', frac * fillWeight);

				// Set stroke weight.
				setStyler('road.highway', 'geometry.stroke', 'weight', "" + frac * strokeWeight);

				// Set text sizes.
				window.map.setOptions({styles: window.map.get('styles')});
			});
		});

		//uiSettings = map.getUiSettings();
		//uiSettings.setZoomGesturesEnabled(true);
		//uiSettings.setScrollGesturesEnabled(true);
		//uiSettings.setRotateGesturesEnabled(true);
	});
}

function loadLandmarks() {
	var primaryHeader = 2, subHeader = primaryHeader + 1, subSubHeader = subHeader + 1;

	$.getJSON("../african_american_landmark_tour/list.json", function(tour) {
		for(var landmark in tour) {
			landmark = tour[landmark];

			if(!landmark.isVisible || !landmark.hasAddress) {
				continue;
			}

			var latlng;
			latlng = new google.maps.LatLng(landmark.latitude, landmark.longitude);

			// Add marker:
			var marker = createMapMarker({
				position: latlng, text: landmark.number
			});

			google.maps.event.addListener(marker, 'click', (function(marker, landmark) {
				return function() {
					var id, dir;

					id = landmark.id;
					dir = "../african_american_landmark_tour/" + id + "/";

					var content = "";
					content += '<div class="infowindow">';
					content += '<h'+primaryHeader+'>' + landmark.name + '</h'+primaryHeader+'>';
					content += '<h'+subSubHeader+'>(' + landmark.address + ')</h'+subSubHeader+'>';
					content += landmark.description+'<br>';

					var audioClips = landmark.audioClips;
					if(audioClips.length > 0) {
						content += '<h'+subHeader+'>Audio Clips</h'+subHeader+'>';

						for(var clip in audioClips) {
							var audioName = dir + "audio";
							if(clip > 0) {
								audioName += clip;
							}
							audioName += ".mp3";

							clip = audioClips[clip];
							content += '<audio controls style="width: 100%;">';
							content += '<source src="' + audioName + '" type="audio/mpeg">';
							content += '</audio>';
							content += '<i>'+clip.audioSource+'</i>';

							content += '<h'+subSubHeader+'>Audio Transcription</h'+subSubHeader+'>';
							content += clip.audioTranscription.replaceAll('\n', '<br>');
						}
					}

					var endWindow = function(content, map, marker) {
						content += '<h'+subHeader+'>More Info</h'+subHeader+'>';
						content += landmark.longDescription.replaceAll('\n', '<br>')+'<br>';
						content += '</div>';

						infowindow.setContent(content);
						infowindow.open(map, marker);
					};

					if(landmark.hasAR) {
						$.getJSON(dir + 'list.json', function(json) {
							content += '<h'+subHeader+'>AR Locations</h'+subHeader+'>';

							var rowClosed = true;
							for(var exp in json) {
								exp = json[exp];

								var wasRowClosed = rowClosed;
								if(rowClosed) {
									rowClosed = false;
									content += '<div style=\"display:table;\">';
								}

								content += "<div style=\"width:50%; height:50%; display:table-cell;\"><img src=\"" + dir + exp.id + "/img.jpg\" style=\"max-width:100%; max-height:100%;\"><i>" + exp.source + "</i></div>";

								if(!wasRowClosed) {
									rowClosed = true;
									content += '</div>';
								}
							}

							if(!rowClosed) {
								content += "<div style=\"width:50%; height:50%; display:table-cell;\"></div>";
								rowClosed = true;
								content += '</div>';
							}

							endWindow(content, window.map, marker);
						});
					} else {
						endWindow(content, window.map, marker);
					}
				}
			})(marker, landmark));
		}
	});
}

function getStylers(featureType, elementType) {
	var options = window.map.get('styles');

	for (var item in options) {
		item = options[item];

		if (item.featureType == featureType && item.elementType == elementType) {
			return item.stylers;
		}
	}

	var row = {'featureType': featureType, 'elementType': elementType, 'stylers': []};
	options.push(row);

	return row.stylers;
}

function setStyler(featureType, elementType, styleType, value) {
	var stylers = getStylers(featureType, elementType);

	for (var item in stylers) {
		item = stylers[item];

		for (var attrib in item) {
			if (attrib == styleType) {
				item[attrib] = value;
				return;
			}
		}
	}

	// Otherwise, didn't find.
	stylers.push({'styleType': value});
}

loadGoogleScripts();
