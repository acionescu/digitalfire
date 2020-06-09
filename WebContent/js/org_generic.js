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
function DNAEvalEngine() {

    /* A runtime object to store temporary reusable values */
    this.runtime = {
	/* these are functions generated from the genetic code */
	exp : {

	}
    }

    this.scopes = [
	    {
		"READV" : {
		    desc : "Reads a custom variable.",
		    usage : "V.&lt;variable name&gt;",
		    regexp : "V\\.\\w*",
		    proc : function(match) {
			var name = match.substring(2);
			return "cell.rule.dna.params." + name;
		    }
		},

		"RAND" : {
		    desc : "Generate a random number between 0 and 1",
		    usage : "RAND",
		    regexp : "RAND",
		    proc : function(match) {
			return "Math.random()";
		    }
		},
		"ROUND" : {
		    desc : "Round to an integer",
		    usage : "ROUND(&lt;expression&gt;) - don't use nested parentheses",
		    regexp : "ROUND\\((.*?\\))",
		    proc : function(match) {
			var subStr = match.substring(6, match.length - 1);
			// console.log("round match "+match+ " round substr:
			// "+subStr);
			return "Math.round(" + self.parseCondition(subStr)
				+ ")";

		    }
		},
		"ABS" : {
		    desc : "Compute absolute value",
		    usage : "ABS(&lt;expression&gt;) - don't use nested parentheses",
		    regexp : "ABS\\((.*?\\))",
		    proc : function(match) {
			var subStr = match.substring(4, match.length - 1);
			return "Math.abs(" + self.parseCondition(subStr) + ")";
		    }
		}
	    },
	    {
		/* global generation */
		"C.GG" : {
		    desc : "Global generation of the cell",
		    usage : "C.GG",
		    regexp : "C\\.GG",
		    proc : function(match) {
			return "cell.rule.dna.gen";
		    }

		},
		/* type generation */
		"C.TG" : {
		    desc : "Type generation of the cell - This will be zero for the first generation of a given cell type and grows in offsprings",
		    usage : "C.TG",
		    regexp : "C\\.TG",
		    proc : function(match) {
			return "cell.rule.dna.params.typeGen";
		    }

		},
		"C.A" : {
		    desc : "Age of the cell - iterations since the cell was born",
		    usage : "C.A",
		    regexp : "C\\.A",
		    proc : function(match) {
			return "cell.age";
		    }
		},
		"C.S" : {
		    desc : "The state of the cell. 1 if on, 0 if off.",
		    usage : "C.S",
		    regexp : "C\\.S",
		    proc : function(match) {
			return "cell.state";
		    }
		},
		/* growth direction */
		"C.GD" : {
		    desc : "The direction in which the cell grows from the parent. A value from 0 to 7. See cell neighbors.",
		    usage : "C.GD",
		    regexp : "C\\.GD",
		    proc : function(match) {
			return "cell.rule.dna.params.growthDir";
		    }
		},
		/* in what single direction should the cell replicate ( 0-7 ) */
		"C.RD" : {
		    regexp : "C\\.RD",
		    proc : function(match) {
			return "cell.rule.dna.params.replicationDir";
		    }
		},
		/*
		 * to what type should this cell replicate ( defaults to cell's
		 * type )
		 */
		"C.RT" : {
		    desc : "The type of the offspring cells.",
		    usage : "C.RT",
		    regexp : "C\\.RT",
		    proc : function(match) {
			return "cell.rule.dna.params.replicationType";
		    }
		},
		/* type of the cell */
		"C.T" : {
		    desc : "The type of the cell.",
		    usage : "C.T",
		    regexp : "C\\.T",
		    proc : function(match) {
			return "cell.rule.dna.params.type";
		    }
		},
		"RP.X" : {
		    desc : "The X coordinate relative to the original cell position.",
		    usage : "RP.X",
		    regexp : "RP\\.X",
		    proc : function(match) {
			return "cell.rule.dna.relPos.x()";
		    }
		},
		"RP.Y" : {
		    desc : "The Y coordinate relative to the original cell position.",
		    usage : "RP.Y",
		    regexp : "RP\\.Y",
		    proc : function(match) {
			return "cell.rule.dna.relPos.y()";
		    }
		},
		"C.G" : {
		    desc : "Cell's gravity",
		    usage : "C.G",
		    regexp : "C\\.G",
		    proc : function(match) {
			return "cell.g";
		    }
		},
		"C.GDIR" : {
		    desc : "The direction of the gravity force felt by a cell. This returns an integer fro 0 to 7 representing the 8  possible directions, or -1 if the resulting force is 0.",
		    usage : "C.GDIR",
		    regexp : "C\\.GDIR",
		    proc : function(match) {
			return "cell.gDir";
		    }
		},
		"C.GMAG" : {
		    desc : "The magnitude of the gravity force acting upon this cell.",
		    usage : "C.GMAG",
		    regexp : "C\\.GMAG",
		    proc : function(match) {
			return "cell.gMag";
		    }
		}
	    }, {

	    } ];

    var self = this;

    /* dna operations */
    this.ops = {
	/* replication operation */
	"R;" : {
	    desc : "Replication function. Replicates the current cell according to its internal state. Relevant parameters are the replication direction and the replication type.",
	    usage : "R;",
	    op : function(cell) {

		cell.rule.dna
			.doReplication(
				cell,
				function(sdna, c, t, i) {
				    var replica = sdna.replicate(c, i);
				    /* replication succeeded */
				    if (replica) {
					if (sdna.params.priority > t.rule.dna.params.priority) {
					    console
						    .log("ups. unwanted replication "
							    + sdna.params.priority
							    + " "
							    + t.rule.dna.params.priority);
					}
					/*
					 * config specified type if this cell is
					 * another type
					 */
					if (sdna.params.replicationType
						&& sdna.params.replicationType != sdna.params.type) {
					    var typeDef = sdna.types[sdna.params.replicationType];
					    // console.log("try to set type
					    // "+sdna.params.replicationType);
					    if (typeDef) {
						// console.log("set type
						// "+sdna.params.replicationType
						// + " for cell");
						for ( var p in typeDef.params) {
						    // console.log("param "+p +"
						    // -> "+typeDef.params[p]);
						    /*
						     * override params for
						     * specific type
						     */
						    replica.params[p] = typeDef.params[p];
						}

					    }
					}
				    } else {
					if (sdna.params.priority < t.rule.dna.params.priority) {
					    // console.log("replication failed
					    // "+sdna.params.priority +"
					    // "+t.rule.dna.params.priority);
					}
				    }
				});
	    }
	},
	/* set replication type */
	"MOVE" : {
	    desc : "Moves this cell in the direction specified via SMD command.",
	    usage : "MOVE;",
	    regexp : "MOVE;",
	    op : function(cell) {
		var cdna = cell.rule.dna;
		var md = cdna.params.moveDir;

		if (md >= 0 && md <= 7 && cell.state == 1) {
		    var n = cell.neighbors[md];
		    if (n == null || n.rule.dna == null) {
			/* deal bounce */
			// if (md % 2 == 1) {
			// cell.gVec.rotate2D(Math.PI);
			// } else {
			// var x = cell.position.x();
			// var y = cell.position.y();
			//
			// var maxSide = cell.universe.config.side - 1
			//
			// if ((x == 0 && md == 0)
			// || (x == maxSide && md == 4)
			// || (y == maxSide && md == 6)
			// || (y == 0 && md == 2)) {
			// cell.gVec.rotate2D(Math.PI / 2);
			// } else {
			// cell.gVec.rotate2D(-Math.PI / 2);
			// }
			// }
			var maxSide = cell.universe.config.side - 1;
			var posx = cell.position.x();
			var posy = cell.position.y();

			var gvecx = cell.gVec.x();
			var gvecy = cell.gVec.y();

			if (posx == 0 || posx == maxSide) {
			    gvecx *= -1;
			}

			if (posy == 0 || posy == maxSide) {
			    gvecy *= -1;
			}

			cell.gVec = new Point([ gvecx, gvecy ]);

			cell.oldGVec = cell.gVec.copy();

			// cell.gVec=new Point([0,0]);
			//			
			// else if(md ==0 && cell.|| md ==4 ){
			// cell.gVec.rotate2D(Math.PI/2);
			// }
			// else{
			// cell.gVec.rotate2D(-Math.PI/2);
			// }
			// console.log("bounce "+cell.gDir +" ->
			// "+mapDirectionToNeighbor(cell.gVec));
			// cell.gVec = cell.gVec.scale([1.1,1.1]);
		    } else if ( n.state ==1 ) {
			/* deal collision */

			var gdif = cell.oldG - n.oldG;
			var gsum = cell.oldG + n.oldG;

			var gr = 0;
			if (gsum != 0) {
			    gr = gdif / gsum;
			}

			if (isNaN(gr)) {
			    gr = 0;
			}

			// var sf1 = 2 * n.oldG / gsum;
			// var sf2 = 2 * cell.oldG / gsum;
			//			
			// var crVec = cell.oldGVec.scale([ gr, gr ]).add(
			// n.oldGVec.scale([ sf1, sf1 ]));
			// var nrVec = n.oldGVec.scale([ -gr, -gr ]).add(
			// cell.oldGVec.scale([ sf2, sf2 ]));
			//			
			// cell.gVec = crVec;
			// cell.oldGVec = crVec.copy();
			// n.gVec = nrVec;
			// n.oldGVec = nrVec.copy();

			/* compute transfer energy ratio */
			var tr = (1 - gr -cell.oldG*cell.oldG/cell.gMag);

			
			var te = cell.gVec.scale([ tr, tr ]);

			cell.gVec = cell.gVec.subtract(te);
			cell.oldGVec = cell.gVec.copy();
			
			n.gVec = n.gVec.add(te);
			n.oldGVec = n.gVec.copy();
			
		    } else {

			var ndna = n.rule.dna;
			if (ndna.params.type == cdna.params.type) {
			    ndna.setStateOn(n);
			    cdna.setStateOff(cell);

			    /* update gs */

			    cell.g -= Cell.META.CONST.CR;
			    if (cell.g < 0) {
				cell.g = 0;
			    }

			    // var
			    // sf=1-Cell.META.CONST.CR/cell.gVec.magnitude();

			    var gsum = cell.oldG + n.oldG;
			    var sf = 1;
			    if (gsum != 0 && cell.gMag != 0) {
				
//				sf = (1 - (cell.g - n.oldG)/ cell.oldG);
				
//				sf = (1 - cell.g*cell.g/cell.gMag);
				
				sf = (1 - (cell.g - n.oldG)/ (cell.oldG+n.oldG) - cell.g*cell.g/cell.gMag);
				
//				sf = (1 - (cell.g - n.oldG + Cell.META.CONST.CTNR )/ cell.oldG - cell.g*Cell.META.CONST.CR/cell.gMag);
			    }

			    n.gVec = cell.gVec.scale([ sf, sf ]);
			    n.oldGVec = cell.oldGVec.scale([ sf, sf ]);

			    cell.gVec = new Point([ 0, 0 ]);
			    cell.oldGVec = new Point([ 0, 0 ]);
			    cell.gMag = 0;
			    cell.gDir = -1;

			    n.g += Cell.META.CONST.CR;

			    n.drawn = false;
			    cell.drawn = false;

			} else {
			    console.log(cell.pos + " -> Cell of type "
				    + cdna.params.type
				    + " can't move to cell of type "
				    + ndna.params.type + " -> " + n.pos);
			}
		    }
		}
	    }
	},

	/* set replication type */
	"SRT" : {
	    desc : "Sets the replication type of the cell. This is used during the replication operation to set the type of the offspring cell.",
	    usage : "SRT(&lt;a predefined cell type&gt;);",
	    regexp : "SRT\\((.*?;)",
	    proc : function(match, offset, string) {
		var subStr = match.substring(4, match.length - 2);

		var pss = subStr.replace(/'/g, "");
		// console.log("SRT match: "+match+ " "+subStr+ " "+pss);
		if (self.runtime.exp[pss] == null) {
		    self.runtime.exp[pss] = self.getCondition(subStr);
		}

		return "Cell.DNA_ENGINE.ops['" + "SRT"
			+ "'].op(cell,Cell.DNA_ENGINE.runtime.exp['" + pss
			+ "']);";
	    },

	    op : function(cell, valFunc) {
		// console.log("calling spinFunc "+spinFunc);
		// console.log("srt val="+valFunc);
		cell.rule.dna.params.replicationType = valFunc(cell);
	    }
	},
	/* set replication direction */
	"SRD" : {
	    desc : "Sets the replication direction of the cell. This is used during the replication operation. The cell will replicate in this direction. See cell neighbors.",
	    usage : "SRD(&lt;a number from 0 to 7&gt;);",
	    regexp : "SRD\\((.*?;)",
	    proc : function(match, offset, string) {
		var subStr = match.substring(4, match.length - 2);

		var pss = subStr.replace(/'/g, "");
		// console.log("SRT match: "+match+ " "+subStr+ " "+pss);
		if (self.runtime.exp[pss] == null) {
		    self.runtime.exp[pss] = self.getCondition(subStr);
		}

		return "Cell.DNA_ENGINE.ops['" + "SRD"
			+ "'].op(cell,Cell.DNA_ENGINE.runtime.exp['" + pss
			+ "']);";
	    },

	    op : function(cell, valFunc) {
		/* get the replication direction */
		var rd = valFunc(cell);
		if (rd < 0 || rd > 7) {
		    console
			    .log("SRD Error: Expected a number between 0 and 7, but got "
				    + rd);
		    return;
		}
		/* initialize replication mask with 0 */
		var rm = [ 0, 0, 0, 0, 0, 0, 0, 0 ];
		/*
		 * set the specified direction to 1, which means the cell will
		 * replicate only in this direction
		 */
		rm[rd] = 1;
		cell.rule.dna.params.replicationMask = rm;
	    }
	},
	/*
	 * Spin replication mask. Accepts the number of spins as a parameter (-7
	 * <-> 7) . Positive to the right, negative to the left
	 */
	"SRM" : {
	    desc : "Spins the cell replication mask vector. A value between -7 and 7 can be given. A negative value spins to the left, a positive value to the right, for that number of times.",
	    usage : "SRM(&lt;number of times&gt;);",
	    regexp : "SRM\\((.*?;)",
	    /*
	     * this further processes the capture group and returns the final
	     * replacement
	     */
	    proc : function(match, offset, string) {
		var spinStr = match.substring(4, match.length - 2);

		if (self.runtime.exp[spinStr] == null) {
		    self.runtime.exp[spinStr] = self.getCondition(spinStr);
		}

		return "Cell.DNA_ENGINE.ops['" + "SRM"
			+ "'].op(cell,Cell.DNA_ENGINE.runtime.exp['" + spinStr
			+ "']);";

		// return "Cell.DNA_ENGINE.ops['" + "SRM"
		// + "'].op(cell,"+parseInt(spinStr)+");";
	    },

	    op : function(cell, spinFunc) {
		// console.log("calling spinFunc "+spinFunc);
		cell.rule.dna.replicationMask = arraySpin(
			cell.rule.dna.replicationMask, spinFunc(cell));
	    }
	},
	/* set move direction */
	"SMD" : {
	    desc : "Sets the move direction of the cell. This is used during the MOVE operation. The cell will move in this direction. See cell neighbors.",
	    usage : "SMD(&lt;a number from 0 to 7&gt;);",
	    regexp : "SMD\\((.*?;)",
	    proc : function(match, offset, string) {
		var subStr = match.substring(4, match.length - 2);

		var pss = subStr.replace(/'/g, "");
		// console.log("SRT match: "+match+ " "+subStr+ " "+pss);
		if (self.runtime.exp[pss] == null) {
		    self.runtime.exp[pss] = self.getCondition(subStr);
		}

		return "Cell.DNA_ENGINE.ops['" + "SMD"
			+ "'].op(cell,Cell.DNA_ENGINE.runtime.exp['" + pss
			+ "']);";
	    },

	    op : function(cell, valFunc) {
		/* get the move direction */
		var md = valFunc(cell);
		if (md < 0 || md > 7) {
		    console
			    .log("SMD Error: Expected a number between 0 and 7, but got "
				    + md);
		    return;
		}

		cell.rule.dna.params.moveDir = md;
	    }
	},

	/* set custom parameter ( always a number ) */
	"SETV" : {
	    desc : "Defines/sets a custom variable. ",
	    usage : "V.&lt;name of the variable&gt;=&lt;expression&gt;;",
	    regexp : "V\\.\\w*=(.*?;)",
	    proc : function(match) {
		var subStr = match.substring(2, match.length - 1);
		var kv = subStr.split("=");
		var name = kv[0];
		var val = kv[1];

		/* create a runtime function vor value expression */
		var vs = val.replace(/'/g, "");
		if (self.runtime.exp[vs] == null) {
		    self.runtime.exp[vs] = self.getCondition(val);
		}

		return "Cell.DNA_ENGINE.ops['" + "SETV"
			+ "'].op(cell,Cell.DNA_ENGINE.runtime.exp['" + vs
			+ "'],'" + name + "');";
	    },
	    op : function(cell, valFunc, param) {
		// console.log("setting "+param +" = "+valFunc);
		var val = valFunc(cell);

		cell.rule.dna.params[param] = val;

	    }
	},
	"DIE" : {
	    desc : "The dna of this cell is deleted, leaving the space empty for another dna to be set.",
	    usage : "DIE;",
	    regexp : "DIE;",
	    op : function(cell) {
		if (cell.rule.dna != null) {
		    cell.rule.dna.reset(cell);
		}
		cell.drawn = false;
	    }
	},
	"ON" : {
	    desc : "Turns the cell on - the cell will be drawn.",
	    usage : "ON;",
	    regexp : "ON;",
	    op : function(cell) {
		cell.rule.dna.setStateOn(cell);
		// cell.color = cell.rule.dna.params.color;
		cell.drawn = false;
	    }
	},
	"OFF" : {
	    desc : "Turns the cell off - the cell will not be drawn but it keeps its code and continues operating.",
	    usage : "OFF;",
	    regexp : "OFF;",
	    op : function(cell) {
		cell.rule.dna.setStateOff(cell);
		// cell.offColor=cell.rule.dna.params.offColor;
		cell.drawn = false;
	    }
	},
	"FLIP" : {
	    desc : "Flips the state of the cell - if ON, it is turned OFF, if OFF, it is turned ON.",
	    usage : "FLIP;",
	    regexp : "FLIP;",
	    op : function(cell) {
		cell.rule.dna.setInverseState(cell);
		cell.drawn = false;
		// if(cell.state){
		// cell.color = cell.rule.dna.params.color;
		// }
	    }
	},
	"SNM" : {
	    desc : "Sets the cell neighbors mask array. Each position of the array addresses a neighbor. Set the value 1 to consider that neighbor when counting alive cells. Set value to 0 to ignore that neighbor. ",
	    usage : "SNM( change rules array or a refference to an array);",
	    regexp : "SNM\\((.*?;)",
	    proc : function(match, offset, string) {
		var subStr = match.substring(4, match.length - 2);

		/* create an expression id to index this function */

		if (self.runtime.exp[subStr] == null) {
		    self.runtime.exp[subStr] = self.getCondition(subStr);
		}

		return "Cell.DNA_ENGINE.ops['" + "SNM"
			+ "'].op(cell,Cell.DNA_ENGINE.runtime.exp['" + subStr
			+ "']);";

	    },
	    op : function(cell, valFunc) {
		var cdna = cell.rule.dna;
		cdna.params.nMask = valFunc(cell);

	    }
	},
	"RNM" : {
	    desc : "Rotate neighbors mask.",
	    usage : "RNM(expression);",
	    regexp : "RNM\\((.*?;)",
	    proc : function(match, offset, string) {
		var subStr = match.substring(4, match.length - 2);

		/* create an expression id to index this function */

		if (self.runtime.exp[subStr] == null) {
		    self.runtime.exp[subStr] = self.getCondition(subStr);
		}

		return "Cell.DNA_ENGINE.ops['" + "RNM"
			+ "'].op(cell,Cell.DNA_ENGINE.runtime.exp['" + subStr
			+ "']);";

	    },
	    op : function(cell, valFunc) {
		var cdna = cell.rule.dna;
		cdna.params.nMask = arraySpin(cdna.params.nMask, valFunc(cell));

	    }
	},
	"SCR" : {
	    desc : "Sets the cell change rules vector. The vector should have 8 elements. The position represents the number of alive neighbors and the value the operation that should be executed. The possible operations in this context are: <br>"
		    + "<ul> "
		    + "<li> '0' - to turn the cell off </li>"
		    + "<li> '1' - to turn the cell on </li>"
		    + "<li> 'i' - to flip the cell </li>" + "</ul> ",
	    usage : "SCR( an array or a refference to an array);",
	    regexp : "SCR\\((.*?;)",
	    proc : function(match, offset, string) {
		var subStr = match.substring(4, match.length - 2);

		/* create an expression id to index this function */

		if (self.runtime.exp[subStr] == null) {
		    self.runtime.exp[subStr] = self.getCondition(subStr);
		}

		return "Cell.DNA_ENGINE.ops['" + "SCR"
			+ "'].op(cell,Cell.DNA_ENGINE.runtime.exp['" + subStr
			+ "']);";

		// return "Cell.DNA_ENGINE.ops['" + "SRM"
		// + "'].op(cell,"+parseInt(spinStr)+");";
	    },
	    op : function(cell, valFunc) {
		var cdna = cell.rule.dna;
		cdna.params.changeRules = valFunc(cell);

	    }
	},

	"CHANGE" : {
	    desc : "Changes the state of the cell according to the change rules. See SCR operation.",
	    usage : "CHANGE;",
	    regexp : "CHANGE;",
	    op : function(cell) {
		var cdna = cell.rule.dna;

		var changeRules = cdna.params.changeRules;

		var alive = 0;
		var n = cell.neighbors;
		var size = n.length;

		if (cdna.params.nMask == null) {
		    /* if no neighbors mask was provided, consider all */
		    cdna.params.nMask = [ 1, 1, 1, 1, 1, 1, 1, 1 ];
		}
		var m = cdna.params.nMask;

		/* neighbor states filtered by mask */
		var nm = [ 0, 0, 0, 0, 0, 0, 0, 0 ];

		/*
		 * initialize gravity as well, starting with the state of the
		 * cell
		 */
		cell.g = cell.oldState;

		/* apply mask */
		for (var i = 0; i < size; i++) {
		    if (n[i] == null) {
			continue;
		    }

		    if ((n[i].oldState & m[i])) {
			nm[i] = 1;
			alive++;

		    }

		    /* update g with the g of the neighbor */
		    cell.g += n[i].oldG;
		    /* update neighbors g forces array */
		    cell.gForces[i] = n[i].oldG;
		}
		// cell.g += alive;
		/* norm g with the max value */
		cell.g = cell.g / (size + 1);

		// var rg = getResultantForce(cell.oldGForces);
		// this.gDir = mapDirectionToNeighbor(rg);
		// this.gMag = rg.magnitude();

		/*
		 * if no change rules are provided, we can't assume a default,
		 * so do nothing
		 */
		if (changeRules == null) {
		    return;
		}

		/* maps alive neighbors positions to integers from 0 to 255 */
		// var opIndex = parseInt(''+ nm.join(''), 2);
		var op = changeRules[alive];
		if (op) {
		    cdna.operations[op](cell);
		} else {
		    console.log("No op for " + alive + " rules size "
			    + changeRules.length);
		}

	    }
	},

	"COMPUTEG" : {
	    desc : "Computes the resulting gravity vector, from neighbors g forces. The gravity direction can be accessed via the GDIR command, and the gravity magnitude via the GMAG command.",
	    usage : "COMPUTEG;",
	    regexp : "COMPUTEG;",
	    op : function(cell) {
		var cdna = cell.rule.dna;

		var alive = 0;
		var n = cell.neighbors;
		var size = n.length;

		/*
		 * initialize gravity as well, starting with the state of the
		 * cell
		 */
		cell.g = cell.oldState;

		var f = 9;

		var selfFactor = cell.oldState / (f * f);

		cell.gForces = [ 0, 0, 0, 0, 0, 0, 0, 0 ];

		/* apply mask */
		for (var i = 0; i < size; i++) {
		    if (n[i] == null) {
			continue;
		    }

		    var ng = n[i].oldG - selfFactor;
		    if (ng < 0) {
			ng = 0;
		    }
		    /* update g with the g of the neighbor */
		    cell.g += ng;
		    /* update neighbors g forces array */
		    cell.gForces[i] = ng;// n[i].oldG;
		}
		// cell.g += alive;
		/* norm g with the max value */
		cell.g = cell.g / f;

		if (cell.state == 1 && (cell.age - cell.stateAge) > 1) {

		    /* compute instant g force */
		    var rg = getResultantForce(cell.gForces);

		    var oldGVec = cell.oldGVec;

		    /* gravity component ratio */
		    var gcr = 1;

		    rg = rg.scale(cell.oldG);

		    var gVec = oldGVec.add(rg);
		    
//		    var rawg = (cell.oldG - Cell.META.CONST.CR);
//
//		    var d = gVec.magnitude() - rawg*rawg;
//
//		    if (d > 0) {
//			var sr = d / gVec.magnitude();
//			gVec = gVec.scale([ sr, sr ]);

			cell.gDir = mapDirectionToNeighbor(gVec);
			cell.gMag = gVec.magnitude();
			cell.gVec = gVec;
//		    } else {
//			cell.gDir = -1
//			cell.gMag = 0;
//			cell.gVec = new Point([ 0, 0 ]);
//		    }

		    if (cell.gMag == null) {
			console.log("Ups. gmag=null " + cell.position.x() + " "
				+ cell.position.y());
		    }

		} else if (cell.oldState != cell.state) {
		    // cell.gDir = -1;
		    // cell.gMag = 0;
		    // cell.gVec = new Point([ 0, 0 ]);
		    // cell.oldGVec = new Point([ 0, 0 ]);

		    // var rg = getResultantForce(cell.gForces);
		    // console.log("instant force on switch: "+cell.oldState+"
		    // -> "+cell.state+" : "+rg.coords);
		}

		// if(cell.state != cell.oldState){
		// console.log(" computeg g="+cell.g+" gMag="+cell.gMag+"
		// gDir="+cell.gDir);
		// }

	    }
	}
    };

    this.scopesMeta = [];

    /* make sure we replace the longer variables and ops first */
    for (var i = 0; i < this.scopes.length; i++) {
	if (!this.scopesMeta[i]) {
	    this.scopesMeta[i] = {};
	}
	this.scopesMeta[i].varsOrder = getPropsAsSortedArray(this.scopes[i],
		false);
    }

    this.opsMeta = {
	opsOrder : getPropsAsSortedArray(this.ops, false)
    };

    /* cell types */
    this.types = {

    }

}

DNAEvalEngine.prototype = new DNAEvalEngine();
DNAEvalEngine.prototype.constructor = DNAEvalEngine;

/**
 * Parses a gene activation function
 */
DNAEvalEngine.prototype.parseCondition = function(input) {
    var out = input;
    for (var si = 0; si < this.scopes.length; si++) {
	var s = this.scopes[si];
	var sm = this.scopesMeta[si];
	// console.log("parse in order: "+sm.varsOrder);
	for ( var pi in sm.varsOrder) {
	    var p = sm.varsOrder[pi];
	    var vDef = s[p];

	    var regexDef = p;
	    if (vDef.regexp != null) {
		regexDef = vDef.regexp;
	    }

	    var rexp = new RegExp(regexDef, 'g');
	    if (vDef.proc != null) {
		out = out.replace(rexp, vDef.proc);

	    } else {
		out = out.replace(rexp, s[p]);
	    }
	    // console.log("parse cond: "+p+" "+input +" -> "+out);
	}

    }

    return out;
}

DNAEvalEngine.prototype.getCondition = function(input) {
    // return eval("(function(cell){ return "+this.parseCondition(input)+";})");
    return new Function('cell', 'return (' + this.parseCondition(input) + ");");
}

DNAEvalEngine.prototype.parseOps = function(input) {
    var out = input;
    for (var i = 0; i < this.opsMeta.opsOrder.length; i++) {
	var opName = this.opsMeta.opsOrder[i];
	var opDef = this.ops[opName];

	if (opDef) {
	    /* don't match ops that have already been replaced */
	    var regexDef = opDef.regexp;
	    if (!regexDef) {
		regexDef = opName;
	    }

	    var regex = new RegExp(regexDef, 'g');
	    if (opDef.proc) {
		out = out.replace(regex, opDef.proc);
	    } else {
		out = out.replace(regex, "Cell.DNA_ENGINE.ops['" + opName
			+ "'].op(cell);");
	    }
	}
	// console.log(" OP: "+input +" -> "+out);
    }
    return out;
}

DNAEvalEngine.prototype.getOps = function(input) {
    var df = new Function('cell', this.parseOps(input));

    return function(cell) {
	try {
	    df(cell);
	} catch (e) {
	    console.log("Failed processing " + input + " with error " + e);
	}
    }
}

DNAEvalEngine.prototype.getGenericGene = function(input) {
    var condString;
    var opsString;

    if (typeof input === 'object') {
	condString = input.cond;
	opsString = input.ops;
    } else {
	var gDef = input.split("->");
	condString = gDef[0].trim();
	opsString = gDef[1].trim();
    }

    var cond = this.getCondition(condString);
    var ops = this.getOps(opsString);

    return new CellGene(cond, ops);
}

/**
 * Generates help.
 */
DNAEvalEngine.prototype.generateHelp = function(name, eDef, container) {
    var desc = eDef.desc;
    var usage = eDef.usage;
    if (!desc || !usage) {
	/* can't generate help if no metadata is present */
	return;
    }

    /* create a container for this property */
    var nc = $("<div id='" + name + "' class='helpCont'>");
    container.append(nc);

    nc.append($("<div class='helpContTitle'>").html(name));

    var ncBody = $("<div class='helpContBody'>");
    nc.append(ncBody);

    ncBody.append($("<div>").html("<b>Description:</b> " + desc));
    ncBody.append($("<div>").html("<b>Usage:</b> " + usage));
}

/**
 * Expects a jquery container
 */
DNAEvalEngine.prototype.generatePropsHelp = function(container) {
    for (var si = this.scopes.length - 1; si >= 0; si--) {
	var s = this.scopes[si];
	for ( var p in s) {
	    this.generateHelp(p, s[p], container);
	}
    }
}

DNAEvalEngine.prototype.generateOpsHelp = function(container) {
    for ( var o in this.ops) {
	var oDef = this.ops[o];

	this.generateHelp(o, oDef, container);
    }
}

Cell.DNA_ENGINE = new DNAEvalEngine();
// console.log(Cell.DNA_ENGINE.getCondition("GG % CRP == CRP"));

function GenericDNA(config) {
    /* call super constructor */
    OrgCellRuleDNA.call(this);

    for ( var g in config.genes) {
	var gDef = config.genes[g];
	/* create a gene object form gene encoding */
	var gene = Cell.DNA_ENGINE.getGenericGene(gDef);
	if (gene) {
	    this.genes[g] = gene;
	}
    }

    if (config.types != null) {
	this.types = config.types;
    }
}

GenericDNA.prototype = new OrgCellRuleDNA();
GenericDNA.prototype.constructor = GenericDNA;

var getURLParams = function(url) {
    if (url == null) {
	url = window.location.href;
    }
    var params = {};
    var parser = document.createElement('a');
    parser.href = url;
    var query = parser.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
	var pair = vars[i].split('=');
	params[pair[0]] = decodeURIComponent(pair[1]);
    }
    return params;
};
