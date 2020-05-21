function TreeDNA(mask, maskSpin, changeRules){
    /* call super constructor */
    OrgCellRuleDNA.call(this, mask, maskSpin, changeRules);
    
    /* various parameters */
    this.params = {
	/* color of the cell */
	color : '#B57E1D',
	/* the direction in which this cell was born */
	growthDir : null,
	/* up to how many generations can a cell replicate */
	maxGrowthGen : 45,

	/* period of branch/root growth, in iterations */
	elongationPeriod : 10,
	/* indicates the relative distance from the center of a branch/root */
	thickenIndex : 0,
	/* after how many generations a branch/root should fork */
	forkingFreq : 10,
	/* how many generations should the branches/roots thicken */
	maxThickenGen : 25,
	
	/* frequency of replication spin */
	spinFreq : 3,
	
	/* time to wait before first spin */
	spinOffset: 10,

	/* the max value of a thickening function */
	maxThickenRatio : 9500,

	/*
	 * considering the relative position, this is the maximum radius from
	 * the origin where the cells can grow
	 */
	maxGrowthRadius : 3000,

	/* the generic growth of a type of cell */
	genericGrowthPeriod : 100,

	/* the period of leaf creation */
	leafCreationPeriod : 3,
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

    this.genes = this.genes || {};
    
    console.log("tree genes "+this.genes);
	
	/* root genesys */
    this.genes["g0"] = new CellGene(
	/* activation condition */
	function(cell) {
	    return cell.age == 2 && cell.rule.dna.gen == 0;
	},
	/* operation */
	function(cell) {
	    var cdna = cell.rule.dna;

	    /* grow roots straight down */
	    var downCell = cell.neighbors[5];

	    cdna.replicate(cell, 5, function(parent, child) {
		child.params.color = 'gray';
		child.replicationMask = [ 0, 0, 0, 0, 0, 1, 0, 0 ];
		child.params.isRoot = true;
		/* roots should fork more often */
		child.params.forkingFreq = 7;
		child.params.maxThickenGen = 15;
		child.params.maxThickenRatio = 5000;
		child.params.maxGrowthGen = 35;
		child.params.elongationPeriod = 8;
	    });

	});
    
	/* branches */
    this.genes["g1"] = new CellGene(
	/* activation condition */
	function(cell) {
	    var cdna = cell.rule.dna;
	    var eligible = !cdna.params.isGrowth
		    && cell.age == cdna.params.elongationPeriod
		    && ((cdna.params.typeGen < cdna.params.maxGrowthGen));

	    var x = cdna.relPos.x();
	    var y = cdna.relPos.y();

	    /* don't allow crossing the medium */
	    if (cdna.gen > 20 && Math.abs(y) <= 10) {
		return false;
	    }

	    if (x * x + y * y > cdna.params.maxGrowthRadius) {
		return false;
	    }
	    

	    return eligible;
	},
	/* operation */
	function(cell) {
	    var cdna = cell.rule.dna;

	    var origMask = cdna.replicationMask.slice();
	    var rcm = cdna.replicationMask;

	    /* apply spin */
	    if (cdna.replicationMaskSpin > 0) {
		rcm.unshift(rcm.pop());
	    } else if (cdna.replicationMaskSpin < 0) {
		rcm.push(rcm.shift());
	    }

	    cdna.replicationMask = rcm;

	    cdna.replicationMaskSpin = 0;
	    /* replicate */
	    cell.rule.dna.doReplication(cell);

	    cdna.replicationMask = origMask;
	});
    
	/* forking gene */
    this.genes["g2"] = new CellGene(
	/* activation condition */
	function(cell) {
	    /* every 10 generations */
	    var cdna = cell.rule.dna;

	    var ff = cdna.params.forkingFreq;
	    return !cdna.params.isGrowth && cdna.gen > 0 && cdna.gen % ff == 0
		    && cell.age == 10;
	},
	/* operation */
	function(cell) {
	    var cdna = cell.rule.dna;
	    var origRepMask = cdna.replicationMask.slice();
	    /* rotate clockwise */
	    var cw = origRepMask.slice();
	    cw.unshift(cw.pop());

	    cdna.replicationMask = cw;
	    cdna.doReplication(cell);

	    /* now counterclockwise */
	    var ccw = origRepMask.slice();
	    ccw.push(ccw.shift());
	    cdna.replicationMask = ccw;
	    cdna.doReplication(cell);

	    /* get back to original replication mask */
	    cdna.replicationMask = origRepMask;
	});
    
	/* spin controller gene */
    this.genes["g3"] = new CellGene(
		/* activation condition */
		function(cell) {
		    var cdna = cell.rule.dna;
		    return cdna.gen > cdna.params.spinOffset && cdna.gen % cdna.params.spinFreq == 0;
		},
		/* operation */
		function(cell) {
		    var cdna = cell.rule.dna;
		    cdna.replicationMaskSpin = ((cdna.replicationMaskSpin + cdna.gen / cdna.params.spinFreq) % 3) - 1;
		    if (Math.random() < 0.1) {
			var r = Math.round(Math.random() * 2 - 1);
			if (r != 0) {
			    cdna.replicationMaskSpin *= r;
			}
		    }
		});
    
	/* growth gene */
    this.genes["g4"] = new CellGene(
		/* activation condition */
		function(cell) {
		    var cdna = cell.rule.dna;
		    if (cdna.gen == 1) {

			// console.log("test grow "+cdna.gen +"
			// "+cdna.replicationMask +
			// " "+ !cdna.params.isGrowth);
		    }
		    // return cell.age > 0 && (cell.age % 100 == 0) && cdna.gen
		    // < 21 &&
		    // !cdna.params.isGrowth;
		    var eligible = cell.age > 0
			    && (cell.age % cdna.params.genericGrowthPeriod == 0)
			    // && cdna.gen < cdna.params.maxThickenGen
			    // && ((cdna.gen + 1) * cell.age) < 7000
			    // && ( cdna.gen + 1 ) * cdna.params.thickenIndex <
			    // 20;
			    && (Math.pow(cdna.gen, 1.35) + 1)
				    * (cell.age*0.65 + 1)
				    * (1 + Math.pow(cdna.params.thickenIndex,
					    1.6)) < cdna.params.maxThickenRatio;
		    // && !cdna.params.isGrowth;

		    if (eligible) {
			/*
			 * normally, roots and branches are constrained by their
			 * medium ( e.g. soil or air ), but here we'll restrict
			 * the medium by dna's relative position from the
			 * origin, where soil represents y above 1 and air as a
			 * negative y
			 */

			if ((cdna.params.isRoot && cdna.relPos.y() <= 1)
				|| (!cdna.params.isRoot && cdna.relPos.y() == 0)) {
			    return false;
			}
		    }

		    return eligible;
		},
		/* operation */
		function(cell) {
		    var cdna = cell.rule.dna;
		    var rma = cdna.replicationMask;

//		    if( (cdna.gen + cdna.params.thickenIndex) % 2 == 0){
		    /* rotate 90 degrees clockwise */
//			rma.unshift(rma.pop());
//			rma.unshift(rma.pop());
//		    }
//		    else{
//			rma.push(rma.shift());
////			rma.push(rma.shift());
//		    }
		    
		    cdna.replicationMask = arraySpin(rma,3);
		    
		    /* try to replicate */
		    cdna
			    .doReplication(
				    cell,
				    function(rdna, c, t, dir) {
					/* override leafs */
					// if(t.rule.dna != null &&
					// t.rule.dna.params.isLeaf){
					// t.rule.dna=null;
					// }
					// var succeeded = rdna.replicate(t);
					var succeeded = rdna.replicate(c, dir);
					if (succeeded) {
					    t.rule.dna.params.isGrowth = true;
					    t.rule.dna.params.thickenIndex = rdna.params.thickenIndex + 1;
					}
				    });

		    // console.log("grow: "+rma);

		    // rma.unshift(rma.pop());
		    // rma.unshift(rma.pop());

		});
	/* leaf creation */
    this.genes["g5"] = new CellGene(
		/* activation condition */
		function(cell) {

		    var cdna = cell.rule.dna;

		    var lcp = cdna.params.leafCreationPeriod;
		    return ((!cdna.params.isLeaf && !cdna.params.isRoot && cdna.params.thickenIndex < 1)
		    // || (cdna.params.isLeaf && cdna.params.typeGen <
		    // cdna.params.maxGrowthGen)
		    )
			    && cdna.gen > 0
			    && cdna.gen % lcp == 0
			    && cell.age == 3;
		},
		/* operation */
		function(cell) {
		    var cdna = cell.rule.dna;
		    var origRepMask = cdna.replicationMask.slice();
		    /* rotate clockwise */
		    var cw = origRepMask.slice();
		    cw.unshift(cw.pop());

		    var lcc = function(rdna, c, t, dir) {
			var succeeded = rdna.replicate(c, dir);
			if (succeeded) {
			    t.rule.dna.params.isLeaf = true;
			    t.rule.dna.params.isGrowth = false;
			    t.rule.dna.params.color = 'green';
			    t.rule.dna.params.maxGrowthGen = 2;
			    t.rule.dna.params.elongationPeriod = 3;
			    t.rule.dna.params.priority = 10;
			    t.rule.dna.replicationMaskSpin = Math.round(Math.random()*0.5 -0.5);
			    t.rule.dna.params.chainType = true;
			    t.rule.dna.params.type='leaf';
			    t.rule.dna.params.forkingFreq=7;
			    t.rule.dna.params.spinFreq=2;
			    t.rule.dna.params.spinOffset=2;
			    if (!rdna.isLeaf) {
				/*
				 * if this is born from a branch, set typeGen to
				 * 0
				 */
				t.rule.dna.params.typeGen = 0;
			    }
			}
		    }

		    cdna.replicationMask = cw;
		    cdna.doReplication(cell, lcc);

		    /* now counterclockwise */
		    var ccw = origRepMask.slice();
		    ccw.push(ccw.shift());
		    cdna.replicationMask = ccw;
		    cdna.doReplication(cell, lcc);

		    /* get back to original replication mask */
		    cdna.replicationMask = origRepMask;
		});
}

TreeDNA.prototype = new OrgCellRuleDNA();
OrgCellRuleDNA.prototype.constructor = TreeDNA;

