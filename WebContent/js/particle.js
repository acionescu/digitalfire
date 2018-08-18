function Point(coords) {
    this.coords = coords;
}

function Shape() {

}

Shape.prototype.draw = function(canvas, position) {
};

function Rectangle(w, h) {
    this.width = w;
    this.height = h;
}

Rectangle.prototype = new Shape();
Rectangle.prototype.constructor = Rectangle;
Rectangle.prototype.draw = function(canvas, position) {
    var coords = position.coords;

    canvas.fillRect(coords[0] * this.width, coords[1] * this.height,
	    this.width, this.height);
};

function CustomShape(points) {
    this.points = points;
    Shape.call(this);
}

CustomShape.prototype = new Shape();
CustomShape.prototype.constructor = CustomShape;

function PhysicalObject(position, shape, mass) {
    this.shape = shape;
    this.mass = mass;
    this.position = position;

}

/* override this for specific behavior */
PhysicalObject.prototype.compute = function(universe) {
};

PhysicalObject.prototype.draw = function(canvas) {
    this.shape.draw(canvas, this.position);
};

function Universe(dimensions) {
    this.dimensions = dimensions;
    this.objects = new Array();
    this.pointsObjects = new Object();
}

Universe.prototype.compute = function() {

    for (var i = 0; i < this.objects.length; i++) {
	this.objects[i].compute(this);
    }
};

Universe.prototype.draw = function(canvas) {

    for (var i = 0; i < this.objects.length; i++) {
	this.objects[i].draw(canvas);
    }
};

Universe.prototype.addObject = function(object) {

    this.objects.push(object);
    this.pointsObjects[object.position.coords] = object;
};

Universe.prototype.getObjectByCoords = function(coords) {
    return this.pointsObjects[coords];
};

function Simulator(universe, canvas) {
    this.universe = universe;
    this.canvas = canvas;

}

Simulator.prototype.run = function() {
    // this.canvas.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.universe.draw(this.canvas);
    this.universe.compute();
};

PhysicalObject.prototype.constructor = PhysicalObject;
Point.prototype.constructor = Point;
Shape.prototype.constructor = Shape;
Universe.prototype.constructor = Universe;
Simulator.prototype.constructor = Simulator;
