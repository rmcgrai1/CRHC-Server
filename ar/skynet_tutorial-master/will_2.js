var WILL = {
	backgroundColor: Module.color.from(255,255,255,0),
	color: Module.color.from(255,0,0, 0.9),

	init: function(width, height) {
		this.initInkEngine(width, height);
		this.initEvents();
	},

	initInkEngine: function(width, height) {
		this.canvas = new Module.InkCanvas(width, height);
		this.strokesLayer = this.canvas.createLayer();

		this.clear();
		this.canvas.clear(Module.color.from(0, 0, 0, 0))

		this.brush = new Module.SolidColorBrush();

		this.pathBuilder = new Module.SpeedPathBuilder();
		this.pathBuilder.setNormalizationConfig(182, 3547);
		this.pathBuilder.setPropertyConfig(Module.PropertyName.Width, 20, 40, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);

		this.smoothener = new Module.MultiChannelSmoothener(this.pathBuilder.stride);

		this.strokeRenderer = new Module.StrokeRenderer(this.canvas);
		this.strokeRenderer.configure({brush: this.brush, color: this.color});
	},

	initEvents: function() {
		var self = this;
		$(Module.canvas).on("mousedown", function(e) {self.beginStroke(e);});
		$(Module.canvas).on("mousemove", function(e) {self.moveStroke(e);});
		$(document).on("mouseup", function(e) {self.endStroke(e);});
	},

	beginStroke: function(e) {
		if (e.button != 0) return;

		this.inputPhase = Module.InputPhase.Begin;

		this.buildPath({x: e.clientX, y: e.clientY});

		this.strokeRenderer.draw(this.pathPart, false);
		this.strokeRenderer.blendUpdatedArea();
	},

	moveStroke: function(e) {
		if (!this.inputPhase) return;

		var self = this;
		this.pointerPos = {x: e.clientX, y: e.clientY};

		this.inputPhase = Module.InputPhase.Move;
		if (this.intervalID) return;

		var lastPointerPos = this.pointerPos;
		this.drawPoint();

		this.intervalID = setInterval(function() {
			if (self.inputPhase && lastPointerPos != self.pointerPos) {
				self.drawPoint();
				lastPointerPos = self.pointerPos;
			}
		}, 16);
	},

	drawPoint: function() {
		this.buildPath(this.pointerPos);

		this.strokeRenderer.draw(this.pathPart, false);
		this.strokeRenderer.drawPreliminary(this.preliminaryPathPart);

		this.canvas.clearArea(this.strokeRenderer.updatedArea, this.backgroundColor);
		this.canvas.blendWithRect(this.strokesLayer, this.strokeRenderer.updatedArea, Module.BlendMode.NORMAL);

		this.strokeRenderer.blendUpdatedArea();
	},

	endStroke: function(e) {
		if (!this.inputPhase) return;

		this.inputPhase = Module.InputPhase.End;
		clearInterval(this.intervalID);
		delete this.intervalID;

		this.buildPath({x: e.clientX, y: e.clientY});

		this.strokeRenderer.draw(this.pathPart, true);
		this.strokeRenderer.blendStroke(this.strokesLayer, Module.BlendMode.NORMAL);

		this.canvas.clearArea(this.strokeRenderer.updatedArea, this.backgroundColor);
		this.canvas.blendWithRect(this.strokesLayer, this.strokeRenderer.updatedArea, Module.BlendMode.NORMAL);

		delete this.inputPhase;
	},

	buildPath: function(pos) {
		if (this.inputPhase == Module.InputPhase.Begin)
			this.smoothener.reset();

		var pathPart = this.pathBuilder.addPoint(this.inputPhase, pos, Date.now()/1000);
		var smoothedPathPart = this.smoothener.smooth(pathPart, this.inputPhase == Module.InputPhase.End);
		var pathContext = this.pathBuilder.addPathPart(smoothedPathPart);

		this.pathPart = pathContext.getPathPart();

		var preliminaryPathPart = this.pathBuilder.createPreliminaryPath();
		var preliminarySmoothedPathPart = this.smoothener.smooth(preliminaryPathPart, true);

		this.preliminaryPathPart = this.pathBuilder.finishPreliminaryPath(preliminarySmoothedPathPart);
	},

	clear: function() {
		this.strokesLayer.clear(this.backgroundColor);
		this.canvas.clear(this.backgroundColor);
	}
};

Module.addPostScript(function() {
	WILL.init(640, 480);
});

var canvas_will = document.getElementById('canvas')
canvas.addEventListener('mousedown', start_movement, false);
canvas.addEventListener('mouseup', end_movement, false);

function handle_movement(evt) {
    var mousePos = getMousePos(canvas, evt);
    if(mousePos.x > bounding_box_end[0]) bounding_box_end[0] = mousePos.x
    if(mousePos.x < bounding_box_start[0]) bounding_box_start[0] = mousePos.x
    if(mousePos.y > bounding_box_end[1]) bounding_box_end[1] = mousePos.y
    if(mousePos.y < bounding_box_start[1]) bounding_box_start[1] = mousePos.y
    console.log(bounding_box_start[0]+','+bounding_box_start[1]+' to '+bounding_box_end[0]+','+bounding_box_end[1]);
}

function start_movement(event) {
	console.log('start')
    bounding_box_start = [10000.0,10000.0]
    bounding_box_end = [0.0,0.0]
    canvas.addEventListener('mousemove', handle_movement)
}

function end_movement(event) {
	console.log('end')
    canvas.removeEventListener('mousemove', handle_movement)
}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}