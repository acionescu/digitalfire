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
var side = 101;
var cellSize = 5;
var automata;
var middle = (Math.pow(side,2)+1)/5;

function CellRule1() {
	this.mask = [ 0, 1, 1, 1, 0, 1, 1, 1 ];
	this.mask2=[ 1, 0, 1, 1, 0, 1, 1, 0 ];
	// [ 1, 0, 1, 1, 1, 1, 0, 1 ];
	this.validStates=new Object();
	this.validStates[[1,1,0,0,0,0,0,0]]=1;
	this.validStates[[0,1,0,0,1,0,0,0]]=1;
	this.validStates[[1,0,0,0,0,0,0,0]]=1;
	this.validStates[[0,0,0,0,0,0,1,1]]=1;
	this.validStates[[0,1,0,1,0,0,1,1]]=1;
	this.validStates[[0,1,0,1,1,0,0,1]]=1;
	this.validStates[[0,0,0,0,1,0,0,1]]=1;
	this.validStates[[1,0,0,0,0,0,0,1]]=1;
	this.validStates[[1,0,0,1,0,0,0,1]]=0;
	this.validStates[[1,0,0,1,0,0,0,0]]=1;
	this.validStates[[0,0,0,0,1,1,1,0]]=1;
	this.validStates[[0,1,1,0,1,0,1,0]]=0;
	this.validStates[[0,1,0,0,1,0,0,0]]=1;
	this.validStates[[0,1,0,0,0,0,1,0]]=1;
	this.validStates[[0,0,0,0,0,1,0,1]]=0;
	this.validStates[[1,0,1,0,1,1,0,1]]=1;
	this.validStates[[0,0,1,0,0,0,0,1]]=0;
	this.validStates[[1,0,1,1,0,1,0,1]]=1;
	this.validStates[[0,0,0,0,0,0,0,1]]=1;
	this.validStates[[0,1,1,0,1,0,1,1]]=0;
}

CellRule1.prototype = new CellRule();
CellRule1.prototype.constructor = CellRule1;
CellRule1.prototype.execute = function(cell) {
	var alive = 0;
	var n = cell.neighbors;
	var size = n.length;
	var m=this.mask;
	var c=cell.position.coords;
	if(c[0]*c[1] < middle){
		m=this.mask2;
	}
	
	for ( var i = 0; i < size; i++) {
		if (n[i].oldState & m[i]) {
			alive++;
		}
//		nstate.push(n[i].oldState);
//		if(n[i].oldState){
//			alive++;
//		}
	}
	
//	if(this.validStates[nstate] || alive==2){
//		cell.state=1;
//	}
//	else{
//		cell.state=0;
//	}

	if (alive < 1) {
		cell.state = 0;
	} else if (alive == 2) {
		cell.state = 1;
	} else if (alive <= 5) {
		// cell.state ^= 1;
		 cell.state = 0;
	} else if (alive == 6) {
			cell.state ^= 1;
	} else {
		cell.state = 0;
	}
	
//	if(alive > 2 && alive < 4){
//		cell.state=1;
//	}
//	else if ( alive <= 6){
//		cell.state ^= 1;
//	}
//	else{
//		cell.state=0;
//	}

	m.push(m.shift());

	//	
	// var n=cell.neighbors;
	// var size = n.length;
	//	
	// if(size > 7 ){
	// cell.state = (n[1].oldState || !n[2].oldState && n[5].oldState)
	// && !(n[0].oldState || n[7].oldState) || n[6].oldState;
	// }

//	 var n = cell.neighbors[1];
//	 if(typeof n != 'undefined'){
//	 if(n.oldState){
//	 cell.state=1;
//	 }
//	 }

};

function populateAutomata(automata, w, h,cs, rule) {
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

	while (++count <= total) {
		p = new Point([ col, row ]);

		cell = new Cell(p, new Rectangle(cs, cs), rule,0);
		var addprev2 = true;

		if (col > 0) {
			var ind = k - 1;
			if (colOffset > 0) {
				ind = col - colOffset;
			}
			// if(typeof prev1[ind] == 'undefined'){
			// alert("row: "+row+" col: "+col);
			// }
			cell.addNeighbor(prev1[ind]);
			prev1[ind].addNeighbor(cell);
			addprev2 = false;
		}

		if (col < colMax) {
			var ind=k;
			if(colOffset > 0){
				ind+=1;
			}
			cell.addNeighbor(prev1[ind]);
			prev1[ind].addNeighbor(cell);
			addprev2 = !addprev2;
		}

		if (k > 0) {
			cell.addNeighbor(current[k - 1]);
			current[k - 1].addNeighbor(cell);
		}

		if (addprev2 && k > 0) {
			var ind = k - 1;
			if (colOffset > 0) {
				ind = col - colOffset;
			}
			if (colOffset > 1) {
				ind += 1;
			}
			cell.addNeighbor(prev2[ind]);
			prev2[ind].addNeighbor(cell);
		}

		current.push(cell);

		automata.addObject(cell);
		row--;
		col++;

		if (row < 0 || col > colMax) {
			rowMax++;
			colMax++;
			if (rowMax >= h) {
				rowMax = h - 1;
				colOffset++;
			}

			if (colMax >= w) {
				colMax = w - 1;
			}

			row = rowMax;
			col = colOffset;
			k = 0;

			prev2 = prev1;
			prev1 = current;
			current = new Array();
		} else {
			k++;
		}
	}
}

function createAutomata(width, height, rule) {

	var ca = new CellularAutomata(2);

	populateAutomata(ca, width, height,cellSize, rule);
	return ca;

}



function startSimulation(canvas) {

	var ctx = canvas.getContext("2d");
	// ctx.width=side;
	// ctx.height=side;
	canvas.addEventListener('mousedown', mouseDownHandler, false);
	canvas.addEventListener('mouseup', mouseUpHandler, false);

	automata = createAutomata(side, side, new CellRule1());
	automata.objects[(side * side + 1) / 2].state = 1;
	automata.objects[((side * side + 1) / 2)+1].state = 1;
	
	var simulator = new Simulator(automata, ctx);
	setInterval(function() {
//		automata.compute();
		simulator.run();
	}, 20);
	
//	setInterval(function() {
//		automata.draw(ctx);
//	}, 200);
	
}

function printNeighbors(cell){
	var n=cell.neighbors;
	var nstate=new Array();
	for ( var i = 0; i < n.length; i++) {
//		if (n[i].oldState & this.mask[i]) {
//			alive++;
//		}
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
	var cell = automata.getObjectByCoords([ Math.ceil(coords.x / cellSize) - 1,
			Math.ceil(coords.y / cellSize) - 1 ]);
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
