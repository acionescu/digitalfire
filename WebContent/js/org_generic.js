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
	    desc: "Reads a custom variable.",
	    usage: "V.&lt;variable name&gt;",
	    regexp: "V\\.\\w*",
	    proc: function(match){
		var name = match.substring(2);
		return "cell.rule.dna.params."+name;
	    }
	},
	
	"RAND" : {
	    desc: "Generate a random number between 0 and 1",
	    usage: "RAND",
	    regexp: "RAND",
	    proc : function(match){
		return "Math.random()";
	    }
	}
	,
	"ROUND" : {
	    desc: "Round to an integer",
	    usage: "ROUND(&lt;expression&gt;) - don't use nested parentheses",
	    regexp:"ROUND\\((.*?\\))",
	    proc:function(match){
		var subStr = match.substring(6,match.length-1);
//		console.log("round match "+match+ " round substr: "+subStr);
		return "Math.round("+self.parseCondition(subStr)+")";
		
	    }
	}
	,
	"ABS" :{
	    desc: "Compute absolute value",
	    usage: "ABS(&lt;expression&gt;) - don't use nested parentheses",
	    regexp:"ABS\\((.*?\\))",
	    proc: function(match){
		var subStr = match.substring(4,match.length-1);
		return "Math.abs("+self.parseCondition(subStr)+")";
	    }
	}
    }, {
	/* global generation */
	"C.GG" : {
	    desc: "Global generation of the cell",
	    usage: "C.GG",
	    regexp:"C\\.GG",
	    proc: function(match){
		return "cell.rule.dna.gen";
	    }
	    
	},
	/* type generation */
	"C.TG" : {
	    desc: "Type generation of the cell - This will be zero for the first generation of a given cell type and grows in offsprings",
	    usage: "C.TG",
	    regexp:"C\\.TG",
	    proc: function(match){
		console.log("match type gen: "+match);
		return "cell.rule.dna.params.typeGen";
	    }
	    
	},
	"C.A" : {
	    desc: "Age of the cell - iterations since the cell was born",
	    usage: "C.A",
	    regexp:"C\\.A",
	    proc: function(match){
		return "cell.age";
	    }
	},
	/* growth direction */
	"C.GD" : {
	    desc: "The direction in which the cell grows from the parent. A value from 0 to 7. See cell neighbors.",
	    usage: "C.GD",
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
	    desc: "The type of the offspring cells.",
	    usage: "C.RT",
	    regexp:"C\\.RT",
	    proc: function(match){
		return "cell.rule.dna.params.replicationType";
	    }
	},
	/* type of the cell */
	"C.T" :{
	    desc: "The type of the cell.",
	    usage: "C.T",
	    regexp:"C\\.T",
	    proc: function(match){
		return "cell.rule.dna.params.type";
	    }
	},
	"RP.X" : {
	    desc: "The X coordinate relative to the original cell position.",
	    usage: "RP.X",
	    regexp:"RP\\.X",
	    proc: function(match){
		return "cell.rule.dna.relPos.x()";
	    }
	},
	"RP.Y" : {
	    desc: "The Y coordinate relative to the original cell position.",
	    usage: "RP.Y",
	    regexp:"RP\\.Y",
	    proc: function(match){
		return "cell.rule.dna.relPos.y()";
	    }
	}
    }, {
	
    } ];

    var self = this;

    /* dna operations */
    this.ops = {
	/* replication operation */
	"R;" : {
	    desc: "Replication function. Replicates the current cell according to its internal state. Relevant parameters are the replication direction and the replication type.",
	    usage: "R;",
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
	    desc: "Sets the replication type of the cell. This is used during the replication operation to set the type of the offspring cell.",
	    usage: "SRT(&lt;a predefined cell type&gt;);",
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
	    desc: "Spins the cell replication mask vector. A value between -7 and 7 can be given. A negative value spins to the left, a positive value to the right, for that number of times.",
	    usage: "SRM(&lt;number of times&gt;);",
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
	    desc: "Defines/sets a custom variable. ",
	    usage: "V.&lt;name of the variable&gt;=&lt;expression&gt;;",
	    regex: "V\\.\\w*=(.*?;)",
	    proc:function(match){
		var subStr = match.substring(2,match.length-1);
		var kv = subStr.split("=");
		var name = kv[0];
		var val = kv[1];
		
		/* create a runtime function vor value expression */
		var vs =val.replace(/'/g,"");
		if(self.runtime.exp[vs] == null){
		    self.runtime.exp[vs] = self.getCondition(val);
		}
		
		return "Cell.DNA_ENGINE.ops['" + "SETV"
		    + "'].op(cell,Cell.DNA_ENGINE.runtime.exp['"+vs+"'],'"+name+"');";
	    },
	    op: function(cell,valFunc,param){
//		console.log("setting "+param +" = "+valFunc);
		var val = valFunc(cell);
		
		cell.rule.dna.params[param]=val;
		
	    }
	},
	"DIE":{
	    desc: "The dna of this cell is deleted, leaving the space empty for another dna to be set.",
	    usage: "DIE;",
	    regexp:"DIE;",
	    op: function(cell){
		if(cell.rule.dna != null){
		    cell.rule.dna.reset(cell);
		}
		cell.drawn=false;
	    }
	},
	"ON":{
	    desc: "Turns the cell on - the cell will be drawn.",
	    usage: "ON;",
	    regexp:"ON;",
	    op: function(cell){
		cell.rule.dna.setStateOn(cell);
		cell.drawn=false;
	    }
	}
	,
	"OFF":{
	    desc: "Turns the cell off - the cell will not be drawn but it keeps its code and continues operating.",
	    usage: "OFF;",
	    regexp:"OFF;",
	    op: function(cell){
		cell.rule.dna.setStateOff(cell);
		cell.drawn=false;
	    }
	}
	,
	"FLIP":{
	    desc: "Flips the state of the cell - if ON, it is turned OFF, if OFF, it is turned ON.",
	    usage: "FLIP;",
	    regexp:"FLIP;",
	    op: function(cell){
		cell.rule.dna.setStateOff(cell);
		cell.drawn=false;
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
    var df= new Function('cell', this.parseOps(input));
    
    return function(cell){
	try{
	    df(cell);
	}
	catch (e){
	    console.log( "Failed processing "+input+" with error "+e);
	}
    }
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

/**
 * Generates help. 
 */
DNAEvalEngine.prototype.generateHelp = function(name, eDef,container){
    var desc = eDef.desc;
    var usage = eDef.usage;
    if(!desc || !usage){
	/* can't generate help if no metadata is present */
	return;
    }
    
    /* create a container for this property */
    var nc=$("<div id='"+name+"' class='helpCont'>");
    container.append(nc);
    
    nc.append($("<div class='helpContTitle'>").html(name));
    
    var ncBody = $("<div class='helpContBody'>");
    nc.append(ncBody);
    
    ncBody.append($("<div>").html("<b>Description:</b> "+desc));
    ncBody.append($("<div>").html("<b>Usage:</b> "+usage));
}

/**
 * Expects a jquery container
 */
DNAEvalEngine.prototype.generatePropsHelp=function(container){
    for(var si=this.scopes.length-1;si>=0;si--){
	var s = this.scopes[si];
	for(var p in s){
	    this.generateHelp(p,s[p],container);
	}
    }
}

DNAEvalEngine.prototype.generateOpsHelp=function(container){
    for(var o in this.ops){
	var oDef = this.ops[o];
	
	this.generateHelp(o,oDef,container);
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
    
    if(config.types != null){
	this.types=config.types;
    }
}

GenericDNA.prototype = new OrgCellRuleDNA();
GenericDNA.prototype.constructor = GenericDNA;

var getURLParams = function (url) {
    	if(url == null){
    	    url=window.location.href;
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




