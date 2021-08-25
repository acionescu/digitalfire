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
function CellGene(cond, op) {
    this.condition = cond;
    this.operation = op;
}

CellGene.prototype = new CellGene();
CellGene.prototype.constructor = CellGene;

CellGene.prototype.execute = function(cell) {
    if (this.condition(cell)) {
	this.operation(cell);
    }
}

function OrgCellRuleDNA(mask, maskSpin, changeRules) {
    /* call super constructor */
    CellRuleDNA.call(this, mask, maskSpin, changeRules);
    /* generation */
    this.gen = 0;

    this.replicationMask = [ 0, 1, 0, 0, 0, 0, 0, 0 ];
    this.replicationMaskSpin = 0;
    this.step = 1;

    /* relative position from the embryo cell */
    this.relPos = new Point([ 0, 0 ]);

    /* various parameters */
    this.params = {
	/* color of the cell */
	color : '#B57E1D',
	/*
	 * priority of this cell type. Types with higher priority can override
	 * lower priority types
	 */
	priority : 0,
	/* type of this cell */
	type : '',
	/* a particular cell type generation */
	typeGen : 0,
	/*
	 * this type creates a chain structure, where, if one cell is changed (
	 * e.g. dies ), it affects the others as well
	 */
	chainType : false
    };

    /* genes */

    this.genes = {
	/* default gene, active in all cells */
	"defg" : new CellGene(
	/* for all cells */
	function(cell) {
	    return cell.age == 0;
	},
	/* operation */
	function(cell) {
	    var cdna = cell.rule.dna;

	    if (cdna.params.color != null) {
		cell.color = cdna.params.color;
	    }
	    /* turn on */
	    cdna.setStateOn(cell);
	}),
	"cupdate" :new CellGene(
		/* for all cells */
		function(cell) {
		    return true;
		},
		/* operation */
		function(cell) {
		    var cdna = cell.rule.dna;

		    if (cdna.params.color != null) {
			cell.color = cdna.params.color;
		    }
		    
		    if(cdna.params.offColor != null){
			cell.offColor=cdna.params.offColor;
		    }
		})
    };

    /* here can be stored configuration params for various cell types */
    this.types = {};
}

OrgCellRuleDNA.prototype = new CellRuleDNA();
OrgCellRuleDNA.prototype.constructor = OrgCellRuleDNA;

OrgCellRuleDNA.prototype.clone = function(callback) {
    var c = new OrgCellRuleDNA(this.maks, this.maskSpin, this.changeRules);
    c.genes = this.genes;
    c.types = this.types;
    /* create a copy of our replication mask */
    c.replicationMask = this.replicationMask.slice();
    c.replicationMaskSpin = this.replicationMaskSpin;
    c.step = this.step;

    /* clone params */
    for ( var pn in this.params) {
	c.params[pn] = this.params[pn];
    }

    if (callback != null) {
	callback(this, c);
    }

    return c;
}

OrgCellRuleDNA.prototype.reset = function(cell) {
    if (cell == null) {
	return;
    }

    /* override target cell */
    var cdna = cell.rule.dna;

    cell.drawn = false;
    /* reset age as well */
    cell.age = 0;

    if (cdna == null) {
	return;
    }

    cdna.setStateOff(cell);
    cell.rule["dna"] = null;

    if (cdna.params.chainType) {

	for ( var i in cell.neighbors) {
	    var n = cell.neighbors[i];
	    if (n != null && n.rule.dna != null
		    && n.rule.dna.params.type == cdna.params.type
		    && n.rule.dna.params.growthDir == i
		    && (n.rule.dna.params.typeGen - cdna.params.typeGen) == 1) {
		n.rule.dna.reset(n);
	    }
	}
    }

}

OrgCellRuleDNA.prototype.replicate = function(sourceCell, direction, callback) {
    var t = sourceCell.neighbors[direction];
    if (t != null && t.rule.dna != null
	    && t.rule.dna.params.priority > sourceCell.rule.dna.params.priority) {
	/* override target cell */
	// t.rule.dna.setStateOff(t);
	// t.rule.dna = null;
	t.rule.dna.reset(t);

    }

    var replica = CellRuleDNA.prototype.replicate.call(this, sourceCell,
	    direction, callback);

    if (!replica) {
	return null;
    }
    /* reset age */
    t.age = 0;
    t.drawn = false;
    /* set state to parent state */
    t.state = sourceCell.state;

    /* increase generation */
    replica.gen = this.gen + 1;

    /* increase type generation */
    replica.params.typeGen = this.params.typeGen + 1;

    /* set the growth direction for the replica */
    replica.params.growthDir = direction;

    /* compute relative position for the replica */
    replica.relPos = this.relPos.add(Cell.META.dirToCoords[direction]);

    /* mark the replica cell as changed */
    t.hasChanged(sourceCell);

    return replica;
}

/* replicates the parameter cell according the replicationMask */
OrgCellRuleDNA.prototype.doReplication = function(cell, callback) {
    var n = cell.neighbors;
    var size = n.length;
    var m = this.replicationMask;

    for (var i = 0; i < size; i++) {
	if (m[i] == 1) {
	    var rc = n[i];
	    if (rc == null) {
		continue;
	    }
	    if (callback == null) {
		// this.replicate(rc);
		this.replicate(cell, i);
	    } else {
		/* delegate to callback */
		callback(this, cell, rc, i)
	    }
	}
    }
}

/**
 * Initializes params acording to the given type
 */
OrgCellRuleDNA.prototype.setupType = function(type) {
    if (type == null) {
	return;
    }
    var typeDef = this.types[type];

    if (typeDef == null) {
	console.log("Unknown type "+type);
	return;
    }
    
    var tDefParams = typeDef.params;
    
    if(tDefParams == null){
	return;
    }

    this.params = {
	/* color of the cell */
	color : 'yellow',
	/*
	 * priority of this cell type. Types with higher priority can override
	 * lower priority types
	 */
	priority : 0,
	/* type of this cell */
	type : type,
	/* a particular cell type generation */
	typeGen : 0,
	/*
	 * this type creates a chain structure, where, if one cell is changed (
	 * e.g. dies ), it affects the others as well
	 */
	chainType : false,
	
	fields:{}
    }

	/* init fields params */
	
	
	for(var ft in FIELDS){
		var fc = FIELDS[ft];
		
		this.params.fields[fc.fieldType]=JSON.parse(JSON.stringify(fc.config.params));
	}

    for ( var pn in tDefParams) {
		this.params[pn] = tDefParams[pn];
    }

}



/**
 * Override default cell behavior
 */
OrgCellRuleDNA.prototype.change = function(cell) {

    // this.setStateOn(cell);
    //
    // /* a simple rule, to replicate when gen is equal with age */
    //
    // if (cell.age == 1) {
    // var n = cell.neighbors;
    // var size = n.length;
    // var m = this.replicationMask;
    //
    // for (var i = 0; i < size; i++) {
    // if (m[i] == 1) {
    // var rc = n[i];
    // if(rc == null){
    // continue;
    // }
    //		
    // this.replicate(rc);
    // rc.rule.dna.replicationMask = this.replicationMask.slice();
    // rc.rule.dna.step = this.step;
    // var rcm = rc.rule.dna.replicationMask;
    //
    // if (this.gen % this.step == 0) {
    // rc.rule.dna.step = this.gen / this.step +1;
    // console.log(this.step);
    // /* apply spin */
    // if (this.replicationMaskSpin > 0) {
    // rcm.unshift(rcm.pop());
    // // rcm.unshift(rcm.pop());
    // } else if (this.replicationMaskSpin < 0) {
    // rcm.push(rcm.shift());
    // }
    // }
    //		
    // }
    // }
    // }

    for ( var gid in this.genes) {
	this.genes[gid].execute(cell);
    }

    cell.age++;
}

function OrgSimulationConfig() {
    SimulationConfig.call(this);

    var defaultMask = [ 1, 1, 0, 0, 0, 1, 1, 1 ];

    this.ruleCreator = function(mask, maskSpin, changeRules) {
	/* by default, we return nothing */
	return null;
    }
}
