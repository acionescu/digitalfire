/*******************************************************************************
 *MIT License
 *
 *Copyright (c) 2020 Adrian Cristian Ionescu
 *
 *Permission is hereby granted, free of charge, to any person obtaining a copy
 *of this software and associated documentation files (the "Software"), to deal
 *in the Software without restriction, including without limitation the rights
 *to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *copies of the Software, and to permit persons to whom the Software is
 *furnished to do so, subject to the following conditions:
 *
 *The above copyright notice and this permission notice shall be included in all
 *copies or substantial portions of the Software.
 *
 *THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *SOFTWARE.
 ******************************************************************************/

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
    /* the order in which this object is updated */
    this.updateIndex=0;
    /* the parent universe */
    this.universe;
}

/* override this for specific behavior */
PhysicalObject.prototype.compute = function(universe) {
};

PhysicalObject.prototype.draw = function(canvas) {
    this.shape.draw(canvas, this.position);
};

/* called to mark that this object was changed this iteration by the changer */
PhysicalObject.prototype.hasChanged=function(changer){
//    console.log("has changed called on "+this.updateIndex);
    /* if this object was changed this iteration by an object that is updated after it, then we need to recompute its state */
    if(changer.updateIndex > this.updateIndex){
	this.changedBy=changer;
	this.universe.toUpdate.push(this);
//	console.log("mark for update "+this.updateIndex);
    }
}

function Universe(dimensions) {
    this.dimensions = dimensions;
    this.objects = new Array();
    this.pointsObjects = new Object();
    this.toUpdate=[];
}

Universe.prototype.compute = function() {

    for (var i = 0; i < this.objects.length; i++) {
	var obj=this.objects[i];
	obj.compute(this);
	/* mark this object as unchanged */
	obj.changedBy=null;
    }
    
    while(this.toUpdate.length > 0){
	var obj = this.toUpdate.shift();
	obj.compute(this);
	obj.changedBy=null;
    }
};

Universe.prototype.draw = function(canvas) {

    for (var i = 0; i < this.objects.length; i++) {
	this.objects[i].draw(canvas);
    }
};

Universe.prototype.addObject = function(object) {
    var objIndex=this.objects.length;
    this.objects.push(object);
    this.pointsObjects[object.position.coords] = object;
    /* the order in which objects are updated */
    object.updateIndex=objIndex;
    object.universe=this;
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
