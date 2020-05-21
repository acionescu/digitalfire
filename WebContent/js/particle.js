//function Point(coords) {
//    this.coords = coords;
//}

function Point(coords) {
    this.coords = coords;
}

Point.prototype.constructor = Point;

Point.prototype.fromJSON=function(json){
    if(json == undefined){
	return;
    }
    this.coords = json.coords;
};

Point.prototype.distance = function(point) {
    this.checkPointDimension(point);

    var sum = 0;

    for (var i = 0; i < this.coords.length; i++) {
	sum += Math.pow(point.coords[i] - this.coords[i], 2);
    }

    return Math.sqrt(sum);

};

Point.prototype.copy = function(){
    return new Point(this.coords.slice());
};

Point.prototype.checkPointDimension = function(point) {
    if(point.coords == undefined){
	throw "Point without coords";
    }
    if (this.coords.length != point.coords.length) {
	throw "Can't compute distance between points with different dimensions: "
		+ this.coords + " and " + point.coords;
    }
};

Point.prototype.x = function(){
    return this.coords[0];
};

Point.prototype.y = function(){
    return this.coords[1];
};

Point.prototype.add = function(point) {
    this.checkPointDimension(point);

    var nc = [];

    for (var i = 0; i < this.coords.length; i++) {
	nc[i] = this.coords[i] + point.coords[i];
    }

    return new Point(nc);
};

Point.prototype.subtract = function(point) {
    this.checkPointDimension(point);

    var nc = [];

    for (var i = 0; i < this.coords.length; i++) {
	nc[i] = this.coords[i] - point.coords[i];
    }

    return new Point(nc);
};

/**
 * 
 * @param drot -
 *                delta rotation in radians
 */
Point.prototype.rotate2D = function(drot) {
    var newCoord = [ 0, 0 ];

    var rotcos = Math.cos(drot);
    var rotsin = Math.sin(drot);

    newCoord[0] = this.coords[0] * rotcos - this.coords[1] * rotsin;
    newCoord[1] = this.coords[0] * rotsin + this.coords[1] * rotcos;

    this.coords = newCoord;
};


/**
 * 
 * @param scale - array with scaling factor for each dimension
 * @returns {Point}
 */
Point.prototype.scale = function(scale){
    if(scale){
    
        this.checkPointDimension(scale);
        var nc = [];
    
        for (var i = 0; i < this.coords.length; i++) {
    		nc[i] = this.coords[i]*scale[i];
        }
        return new Point(nc);
    }
    return this.copy();
};

Point.prototype.equals=function(other){
    if(this.coords.length != other.coords.length){
	return false;
    }
    
    for(var i=0;i<other.coords.length;i++){
	if(this.coords[i] != other.coords[i]){
	    return false;
	}
    }
    
    return true;
};

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
