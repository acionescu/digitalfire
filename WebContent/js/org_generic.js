function DNAEvalEngine() {
    
    /* A runtime object to store temporary reusable values */
    this.runtime={
	    /* these are functions generated from the genetic code */
	    exp:{
		
	    }
    }

    this.scopes = [
    {
	"READV" : {
	    regexp: "V\\.\\w*",
	    proc: function(match){
		var name = match.substring(2);
		return "cell.rule.dna.params."+name;
	    }
	},
	
	"RAND" : {
	    regexp: "RAND",
	    proc : function(match){
		return "Math.random()";
	    }
	}
	,
	"ROUND" : {
	    regexp:"ROUND\\((.*?\\))",
	    proc:function(match){
		var subStr = match.substring(6,match.length-1);
//		console.log("round match "+match+ " round substr: "+subStr);
		return "Math.round("+self.parseCondition(subStr)+")";
		
	    }
	}
	,
	"ABS" :{
	    regexp:"ABS\\((.*?\\))",
	    proc: function(match){
		var subStr = match.substring(4,match.length-1);
		return "Math.abs("+self.parseCondition(subStr)+")";
	    }
	},
	"RP.X" : {
	    regexp:"RP\\.X",
	    proc: function(match){
		return "cell.rule.dna.relPos.x()";
	    }
	},
	"RP.Y" : {
	    regexp:"RP\\.Y",
	    proc: function(match){
		return "cell.rule.dna.relPos.y()";
	    }
	}
	
    }, {
	/* global generation */
	"C.GG" : {
	    regexp:"C\\.GG",
	    proc: function(match){
		return "cell.rule.dna.gen";
	    }
	    
	},
	/* type generation */
	"C.TG" : {
	    regexp:"C\\.TG",
	    proc: function(match){
		console.log("match type gen: "+match);
		return "cell.rule.dna.params.typeGen";
	    }
	    
	},
	"C.A" : {
	    regexp:"C\\.A",
	    proc: function(match){
		return "cell.age";
	    }
	},
	/* growth direction */
	"C.GD" : {
	    regexp:"C\\.GD",
	    proc: function(match){
		return "cell.rule.dna.params.growthDir";
	    }
	},
	/* in what single direction should the cell replicate ( 0-7 ) */
	"C.RD" : {
	    regexp:"C\\.RD",
	    proc: function(match){
		return "cell.rule.dna.params.replicationDir";
	    }
	},
	/* to what type should this cell replicate ( defaults to cell's type ) */
	"C.RT" : {
	    regexp:"C\\.RT",
	    proc: function(match){
		return "cell.rule.dna.params.replicationType";
	    }
	},
	"C.T" :{
	    regexp:"C\\.T",
	    proc: function(match){
		console.log("match type: "+match);
		return "cell.rule.dna.params.type";
	    }
	}
    }, {
	
    } ];

    var self = this;

    /* dna operations */
    this.ops = {
	/* replication operation */
	"R;" : {
	    op : function(cell) {

		cell.rule.dna.doReplication(cell, function(sdna, c, t, i) {
		    var replica = sdna.replicate(c, i);
		    /* replication succeeded */
		    if (replica) {
			if(sdna.params.priority > t.rule.dna.params.priority){
			    console.log("ups. unwanted replication "+sdna.params.priority +" "+t.rule.dna.params.priority);
			}
			/* config specified type if this cell is another type */
			if (sdna.params.replicationType && sdna.params.replicationType != sdna.params.type) {
			    var typeDef = sdna.types[sdna.params.replicationType];
//			    console.log("try to set type "+sdna.params.replicationType);
			    if (typeDef) {
//				console.log("set type "+sdna.params.replicationType + " for cell");
				for ( var p in typeDef.params) {
//				    console.log("param "+p +" -> "+typeDef.params[p]);
				    /* override params for specific type */
				    replica.params[p] = typeDef.params[p];
				}

			    }
			}
		    }
		    else{
			if(sdna.params.priority < t.rule.dna.params.priority){
			    console.log("replication failed "+sdna.params.priority +" "+t.rule.dna.params.priority);
			}
		    }
		});
	    }
	},
	/* set replication type */
	"SRT" : {
	    regex:"SRT\\((.*?;)",
	    proc: function(match,offset,string){
		var subStr = match.substring(4,match.length-2);
		
		var pss = subStr.replace(/'/g,"");
//		console.log("SRT match: "+match+ " "+subStr+ " "+pss);
		if(self.runtime.exp[pss] == null){
		    self.runtime.exp[pss] = self.getCondition(subStr);
		}
		
		return "Cell.DNA_ENGINE.ops['" + "SRT"
		    + "'].op(cell,Cell.DNA_ENGINE.runtime.exp['"+pss+"']);";
	    },

	    op : function(cell, valFunc) {
//		console.log("calling spinFunc "+spinFunc);
//		console.log("srt val="+valFunc);
		cell.rule.dna.params.replicationType=valFunc(cell);
	    }
	},
	/*
	 * Spin replication mask. Accepts the number of spins as a parameter (-7
	 * <-> 7) . Positive to the right, negative to the left
	 */
	"SRM" : {
//	    regex:"SRM\\(-?[0-7]\\);",
	    regex:"SRM\\((.*?;)",
	    /*
	     * this further processes the capture group and returns the final
	     * replacement
	     */
	    proc: function(match,offset,string){
		var spinStr = match.substring(4,match.length-2);
		
		if(self.runtime.exp[spinStr] == null){
		    self.runtime.exp[spinStr] = self.getCondition(spinStr);
		}
		
		return "Cell.DNA_ENGINE.ops['" + "SRM"
		    + "'].op(cell,Cell.DNA_ENGINE.runtime.exp['"+spinStr+"']);";
		
//		return "Cell.DNA_ENGINE.ops['" + "SRM"
//		    + "'].op(cell,"+parseInt(spinStr)+");";
	    },

	    op : function(cell, spinFunc) {
//		console.log("calling spinFunc "+spinFunc);
		cell.rule.dna.replicationMask = arraySpin(cell.rule.dna.replicationMask,spinFunc(cell));
	    }
	},
	/* set custom parameter ( always a number ) */
	"SETV" :{
	    regex: "V\\.\\w*=(.*?;)",
	    proc:function(match){
		var subStr = match.substring(2,match.length-1);
		var kv = subStr.split("=");
		var name = kv[0];
		var val = kv[1];
		
		/* create a runtime function vor value expression */
		
		if(self.runtime.exp[val] == null){
		    self.runtime.exp[val] = self.getCondition(/*"cell.rule.dna.params."+name+"="+*/val);
		}
		
		return "Cell.DNA_ENGINE.ops['" + "SETV"
		    + "'].op(cell,Cell.DNA_ENGINE.runtime.exp['"+val+"'],'"+name+"');";
	    },
	    op: function(cell,valFunc,param){
//		console.log("setting "+param +" = "+valFunc);
		var val = valFunc(cell);
		
		cell.rule.dna.params[param]=val;
		
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
//	console.log("parse in order: "+sm.varsOrder);
	for ( var pi in sm.varsOrder) {
	    var p = sm.varsOrder[pi];
	    var vDef = s[p];
	    
	    var regexDef = p;
	    if(vDef.regexp != null){
		regexDef = vDef.regexp;
	    }
	    
	    var rexp = new RegExp(regexDef, 'g');
	    if(vDef.proc != null){
		out = out.replace(rexp,vDef.proc);
		
	    }
	    else{
		out = out.replace(rexp, s[p]);
	    }
//	    console.log("parse cond: "+p+" "+input +" -> "+out);
	}
	 
    }
   
    return out;
}

DNAEvalEngine.prototype.getCondition = function(input) {
    // return eval("(function(cell){ return "+this.parseCondition(input)+";})");
    return new Function('cell', 'return (' + this.parseCondition(input)+");");
}

DNAEvalEngine.prototype.parseOps = function(input) {
    var out = input;
    for (var i = 0; i < this.opsMeta.opsOrder.length; i++) {
	var opName = this.opsMeta.opsOrder[i];
	var opDef = this.ops[opName];
	
	
	if (opDef) {
	    /* don't match ops that have already been replaced */
	    var regexDef = opDef.regex;
	    if(!regexDef){
		regexDef=opName;
	    }
		
	    var regex = new RegExp(regexDef, 'g');
	    if(opDef.proc){
		out = out.replace(regex, opDef.proc);
	    }
	    else{
        	    out = out.replace(regex, "Cell.DNA_ENGINE.ops['" + opName
        		    + "'].op(cell);");
	    }
	}
//	console.log(" OP: "+input +" -> "+out);
    }
    return out;
}

DNAEvalEngine.prototype.getOps = function(input) {
    return new Function('cell', this.parseOps(input));
}

DNAEvalEngine.prototype.getGenericGene = function(input) {
    var condString;
    var opsString;
    
    if(typeof input === 'object'){
	condString = input.cond;
	opsString = input.ops;
    }
    else{
	var gDef = input.split("->");
	condString = gDef[0].trim();
	opsString=gDef[1].trim();
    }

    var cond = this.getCondition(condString);
    var ops = this.getOps(opsString);

    return new CellGene(cond, ops);
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
    
    if(config.types != null){
	this.types=config.types;
    }
}

GenericDNA.prototype = new OrgCellRuleDNA();
GenericDNA.prototype.constructor = GenericDNA;

var t="(ROUND(GG*RAND())+GD)%3-1".replace(new RegExp("ROUND\\((.*?\\))",'g'),"bla");

console.log("test="+t);
