var $body = $(document.body);

var BR = "<br>";

// SaveBar Static Class.
function _ProgressBar() {
  var
    _text = "",
    _progressFraction = 0,
    _$progressDiv = $("<div class='footer'>").appendTo($body),
    _$progressGroup = $("<div class='progress' style='width: 100%'>").appendTo(_$progressDiv),
    _$progressBar = $("<div class='progress-bar progress-bar-striped active' role='progressbar' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100'>", {
      style:
        "min-width: 2em;"
    }).appendTo(_$progressGroup);

  this.setText = function(text) {
    _text = text;
  };
  this.setProgress = function(progressFraction) {
    _progressFraction = progressFraction;

    var progress = '' + Math.round(progressFraction*100);

    _$progressBar.attr('aria-valuenow', progress);
    _$progressBar.css('width', progress + '%');
  };
  this.show = function() {
    _$progressDiv.fadeIn(100);
  };
  this.hide = function() {
    _$progressDiv.fadeOut(2000);
  };

  this.setProgress(0);
  this.hide();

  return this;
}

var ProgressBar = new _ProgressBar();

$().ready(function() {
  var panelGroup = createPanel('Server');

  panelGroup.$body.append(
    $("<button>").append("Save as Zip").click(save)
  );

  createTourMenu(panelGroup.$body, "../");
  panelGroup.$panel.appendTo($body);
});

var colorStackValues = [0, 0, 0, 0], colorStackLevel = 0;
var colorArray = ["-default", "-primary", "-success", "-info", "-warning", "-danger"];
function enterSubmenu() {
  var value;
  value = colorStackValues[colorStackLevel];
  if(colorStackValues[colorStackLevel]++ >= colorArray.length) {
    colorStackValues[colorStackLevel] -= colorArray.length;
  }

  // Enter new level.
  colorStackLevel++;

  return colorArray[value];
}

function exitSubmenu() {
  for(var i = colorStackLevel--; i < colorStackValues.length; i++) {
    colorStackValues[i] = 0;
  }
}

var serverTree = {};

var
  nullTour = {
    id: '',
    name: '',
    description: ''
  },
  nullLandmark = {
    isVisible: 'false',
    number: 0,
    name: '',
    description: '',
    longDescription: '',
    latitude: 0,
    longitude: 0,
    address: 'N/A',
    hasAddress: false,

    hasAR: false,
    audioClips: [],
    hasAudio: false,
    audioSource: 'N/A'
  },
  nullExperience = {
    id: '',
    targetId: '',
    source: 'N/A'
  };

function addTour() {

}

function addLandmark() {

}

function addExperience() {

}

var canvas = document.createElement('canvas');
function convertImageToBase64(img) {
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  var dataURL;
  dataURL = canvas.toDataURL();

  return dataURL.substr(dataURL.indexOf(',')+1);
}

function async(your_function, callback) {
    setTimeout(function() {
        your_function();
        if (callback) {callback();}
    }, 0);
}

// Saver class
function _Saver() {
  var
    _tourIndex = 0,
    _tourImageIndex = 0;
    _landmarkIndex = 0,
    _experienceIndex = 0,
    _experienceImageIndex = 0,
    _maxWorkTime = 500;

  var _work = function() {

  };
}


function save() {
  var zip = new JSZip();

  var server = serverTree;
  zip.file("list.json", JSON.stringify(server.json));

  for(var tour in server.children) {
    tour = server.children[tour];

    var _tour = zip.folder(tour.dict.id);
    _tour.file("list.json", JSON.stringify(tour.json));

    for(var imgName in tour.images) {
      var img = tour.images[imgName];
      _tour.file(imgName, img.base64, {base64: true});
    }

    for(var landmark in tour.children) {
      landmark = tour.children[landmark];

      var _landmark = _tour.folder(landmark.dict.id);
      _landmark.file("list.json", landmark.json);

      for(var experience in landmark.children) {
        experience = landmark.children[experience];

        var _experience = _landmark.folder(experience.dict.id);
        for(var imgName in experience.images) {
          var img = experience.images[imgName];
          _experience.file(imgName, img.base64, {base64: true});
        }
      }
    }
  }

  ProgressBar.show();
  zip.generateAsync({
    type: "blob",
  },
  function(metaData) {
    ProgressBar.setProgress(metaData.percent/100);
  })
  .then(function(content) {
    // see FileSaver.js
    saveAs(content, "crhc.zip");
    ProgressBar.hide();
  });
}

var Saver = new _Saver();
// End Saver Class

function createGlyphicon(icon) {
  return $("<span class='glyphicon glyphicon-" + icon + "' aria-hidden='true'>");
}

function createPanel(title, color) {
  var
    $panel,
    $heading,
    $title,
    $body;

  if(!color) {
    color = colorArray[0];
  }

  $panel = $("<div class='panel panel"+color+"'>");
  $heading = $("<div class='panel-heading'>").append(title).appendTo($panel);

  $body = $("<div class='panel-body'>").appendTo($panel);

  return {
    $panel: $panel,
    $heading: $heading,
    $body: $body
  };
}

function createTogglePanel(title, isOpen, color) {
  var
    $panel,
    $heading,
    $toggleButton,
    $toggleIcon,
    $title,
    $body;

  if(!color) {
    color = colorArray[0];
  }

  $panel = $("<div class='panel panel"+color+"'>");
  $heading = $("<div class='panel-heading input-group'>").appendTo($panel);

  $toggleButton = $("<span class='input-group-addon'>").appendTo($heading);
  $toggleIcon = createGlyphicon("chevron-down").appendTo($toggleButton);

  if(!!title) {
    $title = $("<span class='input-group-addon'>").append(title).appendTo($heading);
  }

  $body = $("<div class='panel-body'>").appendTo($panel);

  $toggleButton.click(function() {
    $toggleIcon.toggleClass("glyphicon-chevron-right glyphicon-chevron-down");
    $body.toggle();
  });

  if(!isOpen) {
    $toggleButton.click();
  }

  return {
    $panel: $panel,
    $heading: $heading,
    $body: $body
  };
}

function createTextPanel(dict, key, name) {
  var panelGroup;
  panelGroup = createPanel(name);

  panelGroup.$body.addClass("text-container");
  var $textArea = $("<textarea class='boxsizingBorder'>").appendTo(panelGroup.$body);

  $textArea.val(dict[key]);

  $textArea.change(function() {
    var value = $textArea.val();
    dict[key] = value;

    console.log(value);
  });

  return panelGroup.$panel;
}

function createTextField(dict, key, name) {
  var
    $inputGroup;

  $inputGroup = $("<div class='input-group'>");

  createTextFieldChild($inputGroup, dict, key, name);

  return $inputGroup;
}

function createTextFieldChild($parent, dict, key, name) {
  if(!!name) {
    var $inputName = $("<span class='input-group-addon'>").append(name).appendTo($parent);
  }

  var $inputField = $("<input type='text' class='form-control' value='" + dict[key] + "'>").appendTo($parent);
  $inputField.change(function() {
    dict[key] = $inputField.val();
  });
}

function createImageField(dict, key, subPath, name) {
  var
    panelGroup,
    $imagePanelInputGroup,
    $imagePanelTitle,
    $imagePanelUploader,
    $imagePanelImage;

  panelGroup = createTogglePanel(name, false);

  $imagePanelUploader = $("<input type='file' class='form-control'/>")
    .appendTo(panelGroup.$heading);

  //TODO: Change so super wide images don't take up too much vertical space on screen.
  $imagePanelImage = $("<img class='content' width='100%''>")
    .on('load', function() {
      var me = this;
      async(function() {
        me.base64 = convertImageToBase64(me);
      });
    })
    .appendTo(panelGroup.$body)
    .attr("src", subPath+key);

  dict[key] = $imagePanelImage[0];

  panelGroup.$body.addClass("content-background");

  $imagePanelUploader.change(function() {
    if(this.files && this.files[0]) {
      var reader = new FileReader();
      reader.onload = function(e) {
        $imagePanelImage.attr('src', e.target.result);
      };
      reader.readAsDataURL(this.files[0]);
    }
  });

  return panelGroup.$panel;
}

function createTourMenu($parent, path) {
  var onLoad = function(tours) {
    // Create menu.
    // If did not load, fill tours with blank info.
    if(!tours) {
      tours = [];
    }

    serverTree.json = tours;
    serverTree.children = [];

    // Create menu based on tours.
    for(var tour in tours) {
      tour = tours[tour];

      var tourTree = {
        dict: tour,
        children: [],
        images: {}
      };
      serverTree.children.push(tourTree);

      var subPath = path + tour.id + '/';

      var
        panelGroup;

      panelGroup = createTogglePanel('Tour ID', true, enterSubmenu());
      createTextFieldChild(panelGroup.$heading, tourTree.dict, 'id');

      panelGroup.$body.append(
        createTextField(tourTree.dict, 'name', 'Tour Name'),
        createTextPanel(tourTree.dict, 'description', 'Tour Description'),
        createImageField(tourTree.images, 'header.jpg', subPath, 'Header Image')
      );


      /*$tour.append(
        tour.id, BR,
        tour.name, BR,
        tour.description, BR
      );*/

      // Create landmarks.
      createLandmarkMenu(panelGroup.$body, subPath, tourTree);

      panelGroup.$panel.appendTo($parent);
      exitSubmenu();
    }
  };

  // Attempt to load tours from id.
  $.getJSON(path + "list.json")
  .done(function(json, status) {
    if(status == 'success') {
      onLoad(json);
    }
    else {
      onLoad(null);
    }
  })
  .fail(function(data) {
    onLoad(null);
  });
}

function createLandmarkMenu($parent, path, tourTree) {
  var onLoad = function(landmarks) {
    var createLandmark = function(landmark) {
      var landmarkTree = {
        dict: landmark,
        children: [],
        audio: []
      };
      tourTree.children.push(landmarkTree);

      var
        panelGroup;

      panelGroup = createTogglePanel('Landmark ID', false, enterSubmenu());
      createTextFieldChild(panelGroup.$heading, landmarkTree.dict, 'id');

      panelGroup.$body.append(
        createTextField(landmarkTree.dict, 'name', 'Landmark Name'),
        createTextField(landmarkTree.dict, 'number', 'Landmark Number'),
        createTextPanel(landmarkTree.dict, 'description', 'Landmark Description'),
        createTextPanel(landmarkTree.dict, 'longDescription', 'Landmark Long Description')
      );

      createExperienceMenu(panelGroup.$body, path + landmark.id + '/', landmarkTree);

      panelGroup.$panel.appendTo($parent);
      exitSubmenu();
    };

    // If did not load, fill landmarks with blank info.
    if(!landmarks) {
      landmarks = [];
    }

    tourTree.json = landmarks;

    // Create menu based on landmarks.
    for(var landmark in landmarks) {
      landmark = landmarks[landmark];
      createLandmark(landmark);
    }
  };

  // Attempt to load landmarks from id.
  $.getJSON(path + "list.json")
  .done(function(json, status) {
    if(status == 'success') {
      onLoad(json);
    }
    else {
      onLoad(null);
    }
  })
  .fail(function(data) {
    onLoad(null);
  });
}

function createAudioMenu($parent, path, landmarkTree) {

}

function createExperienceMenu($parent, path, landmarkTree) {
  var onLoad = function(experiences) {
    // Create menu.
    // If did not load, fill experiences with blank info.
    if(!experiences) {
      experiences = [];
    }

    landmarkTree.json = experiences;

    // Create menu based on experiences.
    for(var experience in experiences) {
      experience = experiences[experience];

      var experienceTree = {
        dict: experience,
        images: {}
      };
      landmarkTree.children.push(experienceTree);

      var
        $experiencePanel,
        $experiencePanelHeading,
        $experiencePanelBody;

      var subPath = path + experience.id + '/';

      var panelGroup;
      panelGroup = createTogglePanel('Experience ID', false, enterSubmenu());

      createTextFieldChild(panelGroup.$heading, experienceTree.dict, 'id');

      panelGroup.$body.append(
        createImageField(experienceTree.images, 'img.jpg', subPath, 'Experience Image'),
        createImageField(experienceTree.images, 'outlineResized.png', subPath, 'Experience Outline'),
        createImageField(experienceTree.images, 'overlayResized.png', subPath, 'Experience Overlay'),
        createTextField(experience, 'source', 'Experience Source')
      );

      panelGroup.$panel.appendTo($parent);
      exitSubmenu();
    }
  };

  // Attempt to load experiences from id.
  $.getJSON(path + "list.json")
  .done(function(json, status) {
    if(status == 'success') {
      onLoad(json);
    }
    else {
      onLoad(null);
    }
  })
  .fail(function(data) {
    onLoad(null);
  });
}
