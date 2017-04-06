var CRHC = {
	COLORS: {
		BLUE_LIGHT: '#bce6fb',
		RED: '#9e0b0f',
		BLACK: '#000000'
	}
};

var landmarkList = [];

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
	//if(location.protocol === 'https:') {
	navigator.geolocation.getCurrentPosition(function(location) {
		callback(new google.maps.LatLng(location.coords.latitude, location.coords.longitude));
	});
	/*}
	else {
		$.post("https://www.googleapis.com/geolocation/v1/geolocate?key=" + GLOC_API_KEY, "", function(data) {
			callback(data.location);
		});
	}*/
}

var
	directionsRenderer,
	directionsService;

function setDirections(fromLatLng, toLatLng) {
	directionsService.route({
		origin: fromLatLng,
		destination: toLatLng,
		travelMode: 'DRIVING'
	}, function(response, status) {
		if (status == "OK") {
			directionsRenderer.setDirections(response);
		}
	});
}

var
	FRAME_TIME = 16,
	PING_INTERVAL = 2000,
	myMarkerGroup,
	pingGroup,
	pingTime;

function epoch() {
	return (new Date()).getTime();
}

function animatePing() {
	var
		f = (epoch() - pingTime)/PING_INTERVAL,
		options = pingGroup.options;

	options.icon.scale = myMarkerGroup.options.icon.scale * (1 + 5*f);
	options.icon.strokeOpacity = 1-f;

	pingGroup.marker.setOptions({
		icon: options.icon
	});
}

function updatePingLocation() {
	pingTime = epoch();

	getLocation(function(latLng) {
		myLatLng = latLng;

		var options = {
			position: myLatLng
		};
		myMarkerGroup.marker.setOptions(options);
		pingGroup.marker.setOptions(options);

		if(myLatLng != prevLatLng) {
			//setDirections(myLatLng, destinationLatLng);
			prevLatLng = myLatLng;
		}
	});
}

function getLandmark(id) {
	for(var landmark in landmarkList) {
		landmark = landmarkList[landmark];

		if(landmark.id == id) {
			return landmark;
		}
	}
}

var prevLatLng;

var infowindow;
var map, maxZoom = 16, minZoom = 14, startZoom = (maxZoom+minZoom)/2, fillWeight = 3.34, strokeWeight = 8;

function zoomFrac(currentZoom, startZoom) {
	var diff = currentZoom - startZoom;

	return Math.pow(0.5, -diff);
}

var uiSettings;

var
	destinationLatLng,
	destinationGroup,
	destinationLandmark;

function initMap() {
	geocoder = new google.maps.Geocoder();
	infowindow = new google.maps.InfoWindow();

	directionsService = new google.maps.DirectionsService();

	$.getJSON("style.json", function(json) {
			var lng, lat, targetLandmark;
			lng = getUrlParameter('lng');
			lat = getUrlParameter('lat');
			targetLandmark = getUrlParameter('targetLandmark');

			getLocation(function(latLng) {
				myLatLng = latLng;

				window.map = new google.maps.Map($divMap.get(0), {
					zoom: startZoom,
					center: myLatLng,

					mapTypeControl: false,
					streetViewControl: false,

					styles: json
				});

				directionsRenderer = new google.maps.DirectionsRenderer({
					map: window.map,
					polylineOptions: new google.maps.Polyline({
						strokeColor: CRHC.COLORS.RED,
						strokeOpacity: 1.0,
						strokeWeight: 8
					}),
					preserveViewport: true,
					suppressMarkers: true
				});

				google.maps.event.addListener(window.map, 'click', function() {
					infowindow.close();
				});

				loadLandmarks(function() {
					if (!!targetLandmark) {
						targetLandmark = getLandmark(targetLandmark);

						destinationLatLng = targetLandmark.latLng;
						destinationGroup = targetLandmark.group;
						destinationLandmark = targetLandmark;
					}
					else if (!!lng && !!lat) {
						destinationLatLng = new google.maps.LatLng(lat, lng);
						destinationGroup = createMapMarker({
							position: endPoint, text: 'B'
						});
					}

					if(!!destinationLatLng) {
						setDirections(myLatLng, destinationLatLng);
					}
				});

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
					setStyler('road.local', 'geometry.stroke', 'weight', "" + frac * strokeWeight/2);
					setStyler('road.arterial', 'geometry.stroke', 'weight', "" + frac * strokeWeight/2);

					// Set text sizes.
					window.map.setOptions({styles: window.map.get('styles')});
				});

				myMarkerGroup = createMapMarker({
					position: myLatLng,
					fillColor: CRHC.COLORS.RED
				});

				pingGroup = createMapMarker({
					position: myLatLng,
					fillOpacity: 0,
					strokeWeight: 2,
					strokeOpacity: 1,
					strokeColor: CRHC.COLORS.RED
				});

				window.setInterval(animatePing, FRAME_TIME);
				window.setInterval(updatePingLocation, PING_INTERVAL);
			});
		//uiSettings = map.getUiSettings();
		//uiSettings.setZoomGesturesEnabled(true);
		//uiSettings.setScrollGesturesEnabled(true);
		//uiSettings.setRotateGesturesEnabled(true);
	});
}

function changeUrlParameters(dict) {
	//return location.protocol + '//' + location.host + location.pathname;

	var path = location.pathname;

	var i = 0;
	for(var key in dict) {
		if(i++ === 0) {
			path += "?";
		}
		else {
			path += "&";
		}
		path += key + "=" + dict[key];
	}

	history.pushState(null, null, path);
}

function changeDestination(id) {
	changeUrlParameters({
		targetLandmark: id
	});

	var landmark = getLandmark(id);

	if(destinationLandmark === null) {
		destinationGroup.marker.setMap(null);
	}
	else {
		// TODO: Update old marker?
	}

	destinationLatLng = landmark.latLng;
	destinationGroup = landmark.group;
	/*var
		newGroup = destinationGroup = landmark.group,
		newOptions = newGroup.options;
	newGroup.marker.setOptions(newOptions);*/

	destinationLandmark = landmark;

	setDirections(myLatLng, destinationLatLng);
}

function loadLandmarks(callback) {
	var primaryHeader = 2, subHeader = primaryHeader + 1, subSubHeader = subHeader + 1;

	$.getJSON("../african_american_landmark_tour/list.json", function(tour) {
		for(var landmark in tour) {
			landmark = tour[landmark];
			landmarkList.push(landmark);

			if(!landmark.isVisible || !landmark.hasAddress) {
				continue;
			}

			var latLng = landmark.latLng = new google.maps.LatLng(landmark.latitude, landmark.longitude);

			// Add marker:
			landmark.group = createMapMarker({
				position: latLng, text: landmark.number
			});

			var marker = landmark.group.marker;

			google.maps.event.addListener(marker, 'click', (function(marker, landmark) {
				return function() {
					var id, dir;

					id = landmark.id;
					dir = "../african_american_landmark_tour/" + id + "/";

					var content = "";
					content += '<div class="infowindow">';
					content += '<h'+primaryHeader+'>' + landmark.name + '</h'+primaryHeader+'>';
					content += '<h'+subSubHeader+'>(' + landmark.address + ')';
					content += ' <span onclick="changeDestination(\'' + landmark.id + '\');" style="color:'+CRHC.COLORS.RED+';">Get Directions<span class="glyphicon glyphicon-map-marker"></span></span>';
					content += '</h'+subSubHeader+'>';
					content += landmark.description+'<br>';

					var endWindow = function(content, map, marker) {
						if (/\S/.test(landmark.longDescription)) {
							content += '<h'+subHeader+'>More Info</h'+subHeader+'>';
							content += landmark.longDescription.replaceAll('\n', '<br>')+'<br>';
						}

						// Add audio clips.
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

						// End window.
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

								content += "<div style=\"width:50%; height:50%; display:table-cell;\"><img src=\"" + dir + exp.id + "/image.jpg\" style=\"max-width:100%; max-height:100%;\"><i>" + exp.source + "</i></div>";

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
				};
			})(marker, landmark));
		}

		callback();
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
