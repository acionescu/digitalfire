/*******************************************************************************
 * MIT License
 * 
 * Copyright (c) 2020 Adrian Cristian Ionescu
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 ******************************************************************************/

function Point(coords) {
    this.coords = coords;
    this.magVal; // lazy compute

    if (this.coords != null) {
	for (var i = 0; i < coords.length; i++) {
	    this.coords[i] = this.makeSafe(this.coords[i]);
	}
    } else {
	throw "Coords can't be undefined";
    }
}

Point.prototype.constructor = Point;

Point.prototype.makeSafe = function(val) {
    if (val == null) {
	console.log(" Unsafe point coord " + val);
	return 0;
    }
    try {
	if (val > Number.MAX_VALUE) {
	    return Number.MAX_VALUE;
	} else if (val < -Number.MAX_VALUE) {
	    return -Number.MAX_VALUE;
	} else if (Math.abs(val) < Number.MIN_VALUE) {
	    return 0;
	}
    } catch (e) {
	console.log("error too make number safe " + val);
    }
    return val;
}

Point.prototype.fromJSON = function(json) {
    if (json == undefined) {
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

Point.prototype.copy = function() {
    return new Point(this.coords.slice());
};

Point.prototype.checkPointDimension = function(point) {
    if (point.coords == undefined) {
	throw "Point without coords";
    }
    if (this.coords.length != point.coords.length) {
	throw "Can't compute distance between points with different dimensions: "
		+ this.coords + " and " + point.coords;
    }
};

Point.prototype.x = function() {
    return this.coords[0];
};

Point.prototype.y = function() {
    return this.coords[1];
};

Point.prototype.add = function(point) {
    this.checkPointDimension(point);

    var nc = [];

    for (var i = 0; i < this.coords.length; i++) {
	nc[i] = this.makeSafe(this.coords[i] + point.coords[i]);
    }
    // console.log(this.coords +" + "+point.coords+" -> "+nc);
    return new Point(nc);
};

Point.prototype.subtract = function(point) {
    this.checkPointDimension(point);

    var nc = [];

    for (var i = 0; i < this.coords.length; i++) {
	nc[i] = this.makeSafe(this.coords[i] - point.coords[i]);
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
 * @param scale -
 *                array with scaling factor for each dimension
 * @returns {Point}
 */
Point.prototype.scale = function(scale) {
    if (scale == null) {
	throw "Scale vector can't be null";
    }
    if (scale.length == this.coords.length) {

	var nc = [];

	for (var i = 0; i < this.coords.length; i++) {
	    nc[i] = this.makeSafe(this.coords[i] * scale[i]);
	}
	return new Point(nc);
    }
    throw "Scale error: Expected vector of size " + this.coords.length
	    + " but was " + scale.length;
};

Point.prototype.equals = function(other) {
    if (this.coords.length != other.coords.length) {
	return false;
    }

    for (var i = 0; i < other.coords.length; i++) {
	if (this.coords[i] != other.coords[i]) {
	    return false;
	}
    }

    return true;
};

Point.prototype.magnitude = function() {
    if (this.magVal != null) {
	return this.magVal;
    }

    var sum = 0;

    for (var i = 0; i < this.coords.length; i++) {
	var v = this.coords[i];

	var p = this.makeSafe(v * v);
	sum = this.makeSafe(sum + p);

    }

    this.magVal = Math.sqrt(sum);

    return this.magVal;
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
    /* the order in which this object is updated */
    this.updateIndex = 0;
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
PhysicalObject.prototype.hasChanged = function(changer) {
    // console.log("has changed called on "+this.updateIndex);
    /*
     * if this object was changed this iteration by an object that is updated
     * after it, then we need to recompute its state
     */
    if (changer.updateIndex > this.updateIndex) {
	this.changedBy = changer;
	this.universe.toUpdate[this.updateIndex] = this;
	// console.log("mark for update "+this.updateIndex);
    }
}

PhysicalObject.prototype.markAsChanged = function() {
    this.prepareToCompute();
    this.universe.toUpdate[this.updateIndex] = this;

}

/**
 * Override this to prepare the object for a new iteration
 */
PhysicalObject.prototype.prepareToCompute = function() {

}

PhysicalObject.prototype.printObjInfo = function() {

}

function Universe(dimensions, config) {
    this.dimensions = dimensions;
    this.objects = new Array();
    this.pointsObjects = new Object();
    this.toUpdate = {};
    this.config = config;
    this.spherical = false;
    if(config != null){
	this.spherical = !!config.spherical;
    }
}

Universe.prototype.compute = function() {

    for (var i = 0; i < this.objects.length; i++) {
	var obj = this.objects[i];
	/* call prepare to compute on all objects first */
	obj.prepareToCompute();
    }

    for (var i = 0; i < this.objects.length; i++) {
	var obj = this.objects[i];
	obj.compute(this);
	/* mark this object as unchanged */
	obj.changedBy = null;
    }

    var updated = 0;

    do {
	updated = 0;
	for ( var oi in this.toUpdate) {

	    var obj = this.toUpdate[oi];
	    if (obj != null) {
		updated++;
		obj.compute(this);
		obj.changedBy = null;
	    }
	    delete this.toUpdate[oi];
	}
    } while (updated > 0);

    this.toUpdate = {};
};

Universe.prototype.draw = function(canvas) {

    for (var i = 0; i < this.objects.length; i++) {
	this.objects[i].draw(canvas);
    }
};

Universe.prototype.addObject = function(object) {
    var objIndex = this.objects.length;
    this.objects.push(object);
    this.pointsObjects[object.position.coords] = object;
    /* the order in which objects are updated */
    object.updateIndex = objIndex;
    object.universe = this;

    if (this.spherical) {
	var p = object.position;
	var xc = p.x();
	var yc = p.y();
	
	var si = this.config.side-1;

	var xcside = xc == 0 || xc == si;
	var ycside = yc == 0 || yc == si;

	var s2 = si / 2;
	var sm = this.config.side;

	var nxc = xc - sm * Math.sign(xc - s2);
	var nyc = yc - sm * Math.sign(yc - s2);

	if (xcside) {

	    this.setObjectForCoords([ nxc, yc ], object);
	}

	if (ycside) {

	    this.setObjectForCoords([ xc, nyc ], object);
	}

	if(xcside && ycside){
	    this.setObjectForCoords([ nxc, nyc ], object);
	}
	
    }
};

Universe.prototype.setObjectForCoords = function(coords, object) {
    this.pointsObjects[coords] = object;
    var p = object.position;
//    console.log("spherical: " + p.x() + ", " + p.y() + " -> " + coords[0] + ", " + coords[1]);
}

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
