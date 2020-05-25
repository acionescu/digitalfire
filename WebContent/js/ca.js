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
/* cellular automata */

function CellularAutomata(dimensions, config) {

    Universe.call(this, dimensions);
    this.config = config;
}

CellularAutomata.prototype = new Universe();
CellularAutomata.prototype.constructor = CellularAutomata;

/**
 * Cell
 * 
 * @param position
 * @param shape
 * @param rule
 * @param state
 * @returns
 */
function Cell(position, shape, rule, state) {
    this.rule = rule;
    this.state = state;
    this.oldState = state;
    this.color = "Yellow";
    this.age = 0;
    this.drawn = false;
    this.g = 0;
    this.neighbors = new Array();
    this.stateStats = [ 0, 0 ];
    this.fitness = 0;
    PhysicalObject.call(this, position, shape);

}

Cell.prototype = new PhysicalObject();
Cell.prototype.constructor = Cell;

Cell.prototype.compute = function(automata) {
    this.oldState = this.state;
    this.rule.execute(this);
    this.drawn=false;
    this.computeStats();
};

Cell.prototype.computeStats = function() {
    this.stateStats[this.state] += 1;
    var sum = 1 + this.stateStats[0] + this.stateStats[1];
    this.stateStats[0] /= sum;
    this.stateStats[1] /= sum;

}

Cell.prototype.addNeighbor = function(cell) {
    this.neighbors.push(cell);
};

Cell.prototype.draw = function(canvas) {
    if (this.drawn && (this.oldState == this.state) ) {
	return;
    }
    if (this.state) {
	canvas.fillStyle = this.color;
    } else {
	canvas.fillStyle = "Black";
    }
    this.drawn = true;
    PhysicalObject.prototype.draw.apply(this, arguments);
};

Cell.META = Cell.META || {

    /* direction encodings to velocity unit vectors */

    dirToCoords : {

	0 : new Point([ -1, -1 ]),
	1 : new Point([ 0, -1 ]),
	2 : new Point([ 1, -1 ]),
	3 : new Point([ 1, 0 ]),
	4 : new Point([ 1, 1 ]),
	5 : new Point([ 0, 1 ]),
	6 : new Point([ -1, 1 ]),
	7 : new Point([ -1, 0 ]),
    }
};

// var side = 101;
// var cellSize = 5;

// var middle = (Math.pow(side, 2) + 1) / cellSize;
// var mask1 = [ 1, 1, 0, 1, 1, 1, 0, 1 ];
// var mask2 = [ 1, 1, 0, 0, 0, 1, 1, 1 ];

var automata;
var currentConfig;

function SimulationConfig() {
    this.side = 101;
    this.cellSize = 5;
    this.middle = (Math.pow(this.side, 2) + 1) / this.cellSize;
    this.mask1 = [ 1, 1, 0, 1, 1, 1, 0, 1 ];
    this.mask2 = [ 1, 1, 0, 0, 0, 1, 1, 1 ];
    this.changeRules1 = "0,0,1,0,0,i,1,0,0";
    this.changeRules2 = "0,0,1,0,0,i,1,0,0";
    this.autoSpark = true;
    this.useBurnMode = false;
    this.maxNeighbors = 8;
    this.autoInit = false;
    this.ruleCreator = function(mask, maskSpin, changeRules) {
	return new CellRuleDNA(mask, maskSpin, changeRules);
    }

    this.allowedChangeRules = {
	"0" : 1,
	"1" : 1,
	"i" : 1,
	"k" : 1
    };
}

SimulationConfig.prototype.validate = function(errors) {
    this.validateMask(this.mask1, errors);
    this.validateMask(this.mask2, errors);
    this.validateChangeRules(this.changeRules1, errors);
    this.validateChangeRules(this.changeRules2, errors);

    return errors;
};

SimulationConfig.prototype.validateMask = function(mask, errors) {

    if (mask.length != 8) {
	errors.push("The mask should contain exactly 8 elements");
	return;
    }

    for (var i = 0; i < 8; i++) {
	if (mask[i] != 0 && mask[i] != 1) {
	    errors.push("The mask can contain only 1 or 0 values");
	    return;
	}
    }
};

SimulationConfig.prototype.validateChangeRules = function(rules, errors) {

    if (rules.length != 9) {
	errors
		.push("The change rules vector should contain exactly 9 elements");
	return;
    }

    for (var i = 0; i < 9; i++) {
	var e = rules[i];
	if (!this.allowedChangeRules[e]) {
	    errors
		    .push("The only allowed change rules are 0 - off,1 - on, i - reverse state, k - keep current state");
	    return;
	}
    }
};

function CellRule(dna) {
    this.dna = dna;
}

CellRule.prototype.constructor = CellRule;
CellRule.prototype.execute = function(cell) {
    cell.state = false;
};

function delegate(scope, method) {
    if (arguments.length > 2) {
	var args = [];
	var numOfArgs = arguments.length;
	for (var i = 2; i < numOfArgs; i++) {
	    args.push(arguments[i]);
	}
	return function() {
	    console.log("delegate with arguments " + arguments);
	    return method.apply(scope, args);
	}
    } else {

	return function() {
	    console.log("delegate with arguments " + arguments);
	    return method.apply(scope, arguments);
	}
    }
}

function CellRuleDNA(mask, maskSpin, changeRules) {
    /* the mask used to count alive neighboring cells */
    if (mask) {
	this.mask = mask;
    } else {
	this.mask = [ 1, 1, 0, 1, 1, 1, 0, 1 ];
    }
    /* -1 to spin mask to the left, 1 to spin mask to the right */
    if (maskSpin) {
	this.maskSpin = maskSpin;
    } else {
	this.maskSpin = 1;
    }
    /*
     * for the number of alive neighboring cells (0-8) set a state changing
     * function
     */
    if (changeRules) {
	this.changeRules = changeRules;
    } else {
	this.changeRules = [ "0", "0", "1", "0", "0", "i", "1", "0", "0" ];
    }
    this.operations = {
	"0" : this.setStateOff,
	"1" : this.setStateOn,
	"i" : this.setInverseState,
	"k" : function() {
	},
	"m" : delegate(this, this.mutate),
	"r" : this.replicate
    };

    /* 1 if we take into consideration our state, 0 if we don't */
    this.selfMask = 1;

    this.opArray = [ "0", "1", "i", "k", "m" ];

    this.evolvePeriod = Math.round(100 + Math.random() * 100);
    this.evolveStep = 0;
}

CellRuleDNA.prototype.constructor = CellRuleDNA;

CellRuleDNA.prototype.mutate = function() {
    // if(this.opArray == null){
    // return;
    // }
    var maxOpIndex = this.opArray.length - 1;
    var opIndex = Math.round(Math.random() * maxOpIndex);
    var i = Math.round(Math.random() * (this.changeRules.length - 1));
    this.changeRules[i] = this.opArray[opIndex];
    // console.log("mutate");
}

CellRuleDNA.prototype.initRules = function(size, opThreshold) {

    var maxOpIndex = this.opArray.length - 1;
    this.changeRules = new Array(size);

    /*
     * generate random operation mappings for all existing situations that
     * emerge form neighbor states
     */
    for (var i = 0; i < size; i++) {
	// var opIndex = Math.round(Math.random() * maxOpIndex);

	var r = Math.random();
	for (var opIndex = 0; opIndex <= maxOpIndex; opIndex++) {
	    if (r < opThreshold[opIndex]) {
		break;
	    }
	}

	this.changeRules[i] = this.opArray[opIndex];
    }
    // console.log("change rules size: "+this.changeRules.length+" but required
    // "+size+" i= "+i);
}

/**
 * fillRatio - a value form 0 to 1, where 1 means all neighbors will be
 * considered
 */
CellRuleDNA.prototype.initMask = function(size, fillRatio) {
    // console.log("init mask with size "+size);
    for (var i = 0; i <= size; i++) {
	var m = Math.round(0.5 * fillRatio + 0.5 * Math.random());
	this.mask[i] = m;
    }
}

CellRuleDNA.prototype.init = function(maxNeighbors, maskFillRatio, opThreshold) {

    var size = Math.pow(2, maxNeighbors + 1);

    this.initRules(size, opThreshold);
    this.initMask(maxNeighbors, maskFillRatio);
    this.maskSpin = -1 + Math.round(Math.random() * 2);
    this.selfMask = Math.round(Math.random());
}

CellRuleDNA.prototype.change = function(cell) {
    var alive = 0;
    var n = cell.neighbors;
    var size = n.length;
    var m = this.mask;

    /* neighbor states filtered by mask */
    var nm = [ 0, 0, 0, 0, 0, 0, 0, 0 ];

    /* apply mask */
    for (var i = 0; i < size; i++) {
	if (n[i].oldState & m[i]) {
	    nm[i] = 1;
	    alive++;
	} else {
	    nm[i] = 0;
	}
    }

    var digit = parseInt('' + this.selfMask * cell.oldState + nm.join(''), 2);
    // var digit = alive;

    var op = this.changeRules[digit];
    if (op) {
	this.operations[op](cell);
    } else {
	console.log("No op for digit " + digit + " rules size "
		+ this.changeRules.length);
    }

    /* apply spin */
    if (this.maskSpin > 0) {
	m.unshift(m.pop());
    } else {
	m.push(m.shift());
    }

    /* update g */
    cell.g = (cell.g + alive) / (size + 1);

    /* evolve */
    this.evolveStep += 1;
    if (this.evolveStep == this.evolvePeriod) {
	this.evolveStep = 0;
	var cs = cell.stateStats;
	cell.fitness = cs[0] * cs[1] * Math.abs(cs[1] - cs[0]);
	// console.log(cell.fitness);
	if (cell.fitness < 0.2) {
	    this.mutate();
	}
    }
};
CellRuleDNA.prototype.setStateOn = function(cell) {
    cell.state = 1;
};
CellRuleDNA.prototype.setStateOff = function(cell) {
    cell.state = 0;
};
CellRuleDNA.prototype.setInverseState = function(cell) {
    // cell.state = (cell.state + 1) % 2;
    cell.state ^= 1;
};
CellRuleDNA.prototype.combine = function(sources, size) {
    var res = [];
    var sourceSize = sources.length;
    for (var i = 0; i < size; i++) {
	/* parent index */
	var pi = i % sourceSize;
	res[i] = sources[pi][i];
    }
    return res;
};

CellRuleDNA.prototype.crossover = function(dna) {
    var newMask = this.combine([ this.mask, dna.mask ], 8);
    var newChangeRules = this.combine([ this.changeRules, dna.changeRules ], 8);
    var newSpin = this.maskSpin * dna.maskSpin;

    return new CellRuleDNA(newMask, newSpin, newChangeRules);
};

CellRuleDNA.prototype.clone = function() {
    return new CellRuleDNA(this.mask, this.maskSpin, this.changeRules);
}

CellRuleDNA.prototype.replicate = function(sourceCell, direction, callback) {
    var targetCell = sourceCell.neighbors[direction];

    /* use only empty space */
    if (targetCell == null || targetCell.rule.dna != null) {
	return null;
    }

    var replica = this.clone(callback);
    targetCell.rule = new CellRule2(replica);
    return replica;
}

// CellRuleDNA.prototype.replicate = function(targetCell, callback){
// /* use only empty space */
// if(targetCell == null || targetCell.rule.dna != null){
// return null;
// }
//    
// var replica = this.clone(callback);
// targetCell.rule = new CellRule2(replica);
// return replica;
// }

function CellRule1(mask) {
    this.mask = mask;
}

var colors = {
    0 : "Black",
    1 : "Yellow",
    2 : "Yellow",
    3 : "Orange",
    4 : "Orange",
    5 : "Red",
    6 : "Red",
    7 : "White",
    8 : "White"
};

CellRule1.prototype = new CellRule();
CellRule1.prototype.constructor = CellRule1;
CellRule1.prototype.execute = function(cell) {
    var alive = 0;
    var n = cell.neighbors;
    var size = n.length;
    var m = this.mask;
    var c = cell.position.coords;

    function born() {
	for (var i = 0; i < m.length; i++) {
	    for (var k = 0; k < size; k++) {
		m[i] ^= n[k].mask[i];
	    }
	}
    }

    /* apply mask */
    for (var i = 0; i < size; i++) {
	if (n[i].oldState & m[i]) {
	    alive++;
	}
    }

    /* apply rule */

    if (alive < 1) {
	cell.state = 0;
    } else if (alive == 2) {
	cell.state = 1;
    } else if (alive == 4) {
	cell.state = (cell.state + 1) % 2;
    } else if (alive <= 5) {
	cell.state = 0;
    } else if (alive == 6) {

    } else {
	cell.state = 0;
    }

    /* apply spin */
    // m.push(m.shift());
    m.unshift(m.pop());

};

function CellRule2(dna) {
    CellRule.call(this, dna);
    this.tick = 0;
}

CellRule2.prototype = new CellRule();
CellRule2.prototype.constructor = CellRule2;
CellRule2.prototype.execute = function(cell) {

    if (this.dna == null) {
	return;
    }

    /* apply change rules */
    this.dna.change(cell);

    // if(cell.state){
    // this.dna = this.dna.crossover(parents[0].rule.dna);
    // }

    // this.tick++;
    // this.tick %= 8;
    //
    // if (this.tick == 0) {
    // this.dna.maskSpin *= -1;
    // }
};

function CASimulation(config) {
    this.config = config;
    this.automata;
    this.interval;
}

CASimulation.prototype.constructor = CASimulation;

CASimulation.prototype.populateAutomata = function(automata) {
    var config = automata.config;
    var side = config.side;
    var w = side;
    var h = side;
    var cs = config.cellSize;

    var prev1 = new Array();
    var prev2 = new Array();
    var current = new Array();

    var row = 0;
    var col = 0;

    var rowMax = 0;
    var colMax = 0;
    var colOffset = 0;
    var count = 0;
    var total = w * h;
    var cell;
    var p;
    var k = 0;

    // while (++count <= total) {
    // p = new Point([ col, row ]);
    // var m = config.mask1;
    // var changeRules = config.changeRules1;
    // var mr = 0.7;
    // var opt = [ 0.8, 0.81, 0.9, 1, 1 ];
    //
    // if (Math.sqrt(Math.pow(Math.abs(side / 2 - col), 2)
    // + Math.pow(Math.abs(side / 2 - row), 2)) > 30) {
    // m = config.mask2;
    // changeRules = config.changeRules2;
    // mr = 0.9;
    // }
    //	
    // var cellDna = config.ruleCreator(m, 1, changeRules);
    // if (config.autoInit && cellDna != null) {
    // cellDna.init(config.maxNeighbors, mr, opt);
    // }
    //
    // cell = new Cell(p, new Rectangle(cs, cs), new CellRule2(cellDna), 0);
    // if (config.useBurnMode) {
    // cell.drawn = true;
    // }
    //
    // var addprev2 = true;
    //
    // if (col > 0) {
    // var ind = k - 1;
    // if (colOffset > 0) {
    // ind = col - colOffset;
    // }
    // // if(typeof prev1[ind] == 'undefined'){
    // // alert("row: "+row+" col: "+col);
    // // }
    // cell.addNeighbor(prev1[ind]);
    // prev1[ind].addNeighbor(cell);
    // addprev2 = false;
    // }
    //
    // if (col < colMax) {
    // var ind = k;
    // if (colOffset > 0) {
    // ind += 1;
    // }
    // cell.addNeighbor(prev1[ind]);
    // prev1[ind].addNeighbor(cell);
    // addprev2 = !addprev2;
    // }
    //
    // if (k > 0) {
    // cell.addNeighbor(current[k - 1]);
    // current[k - 1].addNeighbor(cell);
    // }
    //
    // if (addprev2 && k > 0) {
    // var ind = k - 1;
    // if (colOffset > 0) {
    // ind = col - colOffset;
    // }
    // if (colOffset > 1) {
    // ind += 1;
    // }
    // cell.addNeighbor(prev2[ind]);
    // prev2[ind].addNeighbor(cell);
    // }
    //
    // current.push(cell);
    //
    // automata.addObject(cell);
    // row--;
    // col++;
    //
    // if (row < 0 || col > colMax) {
    // rowMax++;
    // colMax++;
    // if (rowMax >= h) {
    // rowMax = h - 1;
    // colOffset++;
    // }
    //
    // if (colMax >= w) {
    // colMax = w - 1;
    // }
    //
    // row = rowMax;
    // col = colOffset;
    // k = 0;
    //
    // prev2 = prev1;
    // prev1 = current;
    // current = new Array();
    // } else {
    // k++;
    // }
    // }

    for (row = 0; row < w; row++) {
	for (col = 0; col < h; col++) {
	    p = new Point([ col, row ]);
	    var m = config.mask1;
	    var changeRules = config.changeRules1;
	    var mr = 0.7;
	    var opt = [ 0.8, 0.81, 0.9, 1, 1 ];
//
//	    if (Math.sqrt(Math.pow(Math.abs(side / 2 - col), 2)
//		    + Math.pow(Math.abs(side / 2 - row), 2)) > 30) {
//		m = config.mask2;
//		changeRules = config.changeRules2;
//		mr = 0.9;
//	    }

	    var cellDna = config.ruleCreator(m, 1, changeRules);
	    if (config.autoInit && cellDna != null) {
		cellDna.init(config.maxNeighbors, mr, opt);
	    }

	    cell = new Cell(p, new Rectangle(cs, cs), new CellRule2(cellDna), 0);
	    if (config.useBurnMode) {
		cell.drawn = true;
	    }

	    automata.addObject(cell);
	}
    }
    /* add neighbours */

    for (row = 0; row < w; row++) {
	for (col = 0; col < h; col++) {
	    var c = automata.getObjectByCoords([ col, row ]);

	    c.addNeighbor(automata.getObjectByCoords([ col - 1, row - 1 ]));
	    c.addNeighbor(automata.getObjectByCoords([ col, row - 1 ]));
	    c.addNeighbor(automata.getObjectByCoords([ col + 1, row - 1 ]));
	    c.addNeighbor(automata.getObjectByCoords([ col + 1, row ]));
	    c.addNeighbor(automata.getObjectByCoords([ col + 1, row + 1 ]));
	    c.addNeighbor(automata.getObjectByCoords([ col, row + 1 ]));
	    c.addNeighbor(automata.getObjectByCoords([ col - 1, row + 1 ]));
	    c.addNeighbor(automata.getObjectByCoords([ col - 1, row ]));
	}
    }

}

CASimulation.prototype.createAutomata = function(config) {

    var ca = new CellularAutomata(2, config);

    this.populateAutomata(ca);
    return ca;
}

CASimulation.prototype.startSimulation = function(canvas, config) {
    console.log("Start simulaltion");
    currentConfig = config;
    var side = config.side;
    var ctx = canvas.getContext("2d");
    var width = side * config.cellSize;
    ctx.clearRect(0, 0, width, width);

    // ctx.width=side;
    // ctx.height=side;
    canvas.addEventListener('mousedown', delegate(this, this.onMouseDown),
	    false);
    canvas.addEventListener('mouseup', mouseUpHandler, false);

    this.automata = this.createAutomata(config);
    console.log("automata createad");
    // automata.objects[(side * side + 1) / 2].state = 1;
    // automata.objects[((side * side + 1) / 2) + 1].state = 1;

    var output = new Array();
    var input = new Array();
    var mid = (side * side + 1) / 2 + side;

    if (!config.autoInit) {
	for (var i = mid - 100; i < mid + 100; i++) {
	    // output.push(automata.objects[i]);
	    // input.push(automata.objects[i + 4000]);
	    if (config.autoSpark) {
		this.automata.objects[i].state = 1;
	    }
	}
    }

    var simulator = new Simulator(this.automata, ctx);
    var c = 0;

    this.interval = setInterval(function() {

	simulator.run();

    }, 20);

}

CASimulation.prototype.stopSimulation = function() {
    clearInterval(this.interval);
}

CASimulation.prototype.onMouseDown = function(event) {
    console.log("event=" + event);
    var coords = relMouseCoords(event);
    var cell = this.automata.getObjectByCoords([
	    Math.ceil(coords.x / currentConfig.cellSize) - 1,
	    Math.ceil(coords.y / currentConfig.cellSize) - 1 ]);

    console.log(JSON.stringify(cell.rule));
}

function readOutput(out) {
    var s = "";
    for (var i = 0; i < out.length; i++) {
	s += out[i].state;
    }
    return parseInt(s, 2);
}

function setInput(input, val) {
    for (var i = 0; i < val.length; i++) {
	input[i].state = parseInt(val[i]);
    }
}

function printNeighbors(cell) {
    var n = cell.neighbors;
    var nstate = new Array();
    for (var i = 0; i < n.length; i++) {
	// if (n[i].oldState & this.mask[i]) {
	// alive++;
	// }
	nstate.push(n[i].oldState);
	alert(n[i].oldState);
    }
    alert(nstate.join(","));
}

function mouseDownHandler(event) {
    flipCell(event);
    event.target.addEventListener('mousemove', mouseMoveHandler, false);
}

function mouseUpHandler(event) {
    event.target.removeEventListener('mousemove', mouseMoveHandler, false);
}

function mouseMoveHandler(event) {
    flipCell(event);
    // console.log(event);
}

function flipCell(event) {
    var coords = relMouseCoords(event);
    var cell = automata.getObjectByCoords([
	    Math.ceil(coords.x / currentConfig.cellSize) - 1,
	    Math.ceil(coords.y / currentConfig.cellSize) - 1 ]);
    cell.state ^= 1;
}

function relMouseCoords(event) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = event.target;

    do {
	totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
	totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    } while (currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {
	x : canvasX,
	y : canvasY
    };
}

function arraySpin(arr, spin) {
    var c = Math.abs(spin);
    c = c % arr.length;
    if (spin < 0) {
	return arr.concat(arr.splice(0, c));
    } else {
	return arr.splice(arr.length-c,c).concat(arr);
    }
}

function getPropsAsSortedArray(obj, asc){
    var arr =[];
    
    for(var p in obj){
	arr.push(p);
    }
    var orig = arr.slice();
    
    var out = arr.sort(function(f,s){
	if( asc){
	  return (f.length - s.length);
	}
	return -(f.length - s.length);
    });
    return out;
}
