function createMapMarker(args) {
  if(args === null) {
    args = {};
  }

  defaultTo(args, "text", " ");

  defaultTo(args, "fillColor", CRHC.COLORS.BLUE_LIGHT);
  defaultTo(args, "fillOpacity", 1);

  defaultTo(args, "strokeColor", CRHC.COLORS.BLACK);
  defaultTo(args, "strokeOpacity", 0);
  defaultTo(args, "strokeWeight", 1);

  defaultTo(args, "scale", 10);

  var options = {
    position: args.position,
    map: window.map,
    label: {
      text: args.text.toString(),
      fontSize: 'Roboto'
    },
    icon: {
      fillColor: args.fillColor,
      fillOpacity: args.fillOpacity,

      strokeColor: args.strokeColor,
      strokeWeight: args.strokeWeight,
      strokeOpacity: args.strokeOpacity,

      path: google.maps.SymbolPath.CIRCLE,
      scale: args.scale
    }
  };

  return {
    options: options,
    marker: new google.maps.Marker(options)
  };
}
