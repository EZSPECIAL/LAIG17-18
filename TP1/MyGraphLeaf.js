/**
 * MyGraphLeaf class, representing a leaf in the scene graph.
 * Handles all the parsing of the leaf nodes and creates the appropriate primitives.
 * @constructor
 */

function MyGraphLeaf(graph, xmlelem, type) {
	
	this.primitive = null;
	this.error = null;
	this.type = type;
	
	var primitiveArgs = [];
	
	switch(type) {
		
		/**
		 * Triangle handling
		 *
		 */
		case 'triangle':

			//Get triangle arguments
			var argString = graph.reader.getString(xmlelem, 'args');
			
			if(this.checkNull(argString)) {this.sendError("attribute", "args"); return;}

			//Split values into array
			var splitted = this.splitOnWhitespace(argString);
			for(var i = 0; i < splitted.length; i++) {
				primitiveArgs.push(parseFloat(splitted[i]));
			}
			
			//Triangle argument validation
			if(primitiveArgs.length != 9) {this.sendError("number", ["9", "args", primitiveArgs.length]); return;}
			if(!this.checkNumber(primitiveArgs, "args")) return;
			
			this.primitive = new MyTriangleLeaf(graph.scene, primitiveArgs);
			
		break;
		
		
		/**
		 * Rectangle handling
		 *
		 */
		case 'rectangle':
			
			//Get rectangle arguments
			var argString = graph.reader.getString(xmlelem, 'args');
			
			if(this.checkNull(argString)) {this.sendError("attribute", "args"); return;}
			
			//Split values into array
			var splitted = this.splitOnWhitespace(argString);
			for(var i = 0; i < splitted.length; i++) {
				primitiveArgs.push(parseFloat(splitted[i]));
			}
			
			//Rectangle argument validation
			if(primitiveArgs.length != 4) {this.sendError("number", ["4", "args", primitiveArgs.length]); return;}
			if(!this.checkNumber(primitiveArgs, "args")) return;
			
			this.primitive = new MyRectangleLeaf(graph.scene, [primitiveArgs[0], primitiveArgs[1], 0], [primitiveArgs[2], primitiveArgs[3], 0]);

		break;
		
		
		/**
		 * Cylinder handling
		 *
		 */
		case 'cylinder':
			
			//Get cylinder arguments
			var argString = graph.reader.getString(xmlelem, 'args');
			
			if(this.checkNull(argString)) {this.sendError("attribute", "args"); return;}
			
			//Split values into array
			var splitted = this.splitOnWhitespace(argString);
			for(var i = 0; i < splitted.length; i++) {
				primitiveArgs.push(parseFloat(splitted[i]));
			}
			
			//Cylinder argument validation
			if(primitiveArgs.length != 7) {this.sendError("number", ["7", "args", primitiveArgs.length]); return;}
			if(!this.checkNumber(primitiveArgs, "args")) return;

			if(primitiveArgs[1] <= 0 || primitiveArgs[2] <= 0) {this.sendError("valueLE", ["radius", "0"]); return;}
			if(primitiveArgs[3] < 1) {this.sendError("value", ["stacks", "1"]); return;}
			if(primitiveArgs[4] < 3) {this.sendError("value", ["slices", "3"]); return;}
			if((primitiveArgs[5] != 0 && primitiveArgs[5] != 1) || (primitiveArgs[6] != 0 && primitiveArgs[6] != 1)) {this.sendError("valueOR", ["lid", "0", "1"]); return;}
			
			this.primitive = new MyCylinderLeaf(graph.scene, primitiveArgs[0], primitiveArgs[1], primitiveArgs[2], primitiveArgs[3], primitiveArgs[4], primitiveArgs[5], primitiveArgs[6]);

		break;
		
		
		/**
		 * Sphere handling
		 *
		 */
		case 'sphere':
		
			//Get sphere arguments
			var argString = graph.reader.getString(xmlelem, 'args');
			
			if(this.checkNull(argString)) {this.sendError("attribute", "args"); return;}
			
			//Split values into array
			var splitted = this.splitOnWhitespace(argString);
			for(var i = 0; i < splitted.length; i++) {
				primitiveArgs.push(parseFloat(splitted[i]));
			}
			
			//Sphere argument validation
			if(primitiveArgs.length != 3) {this.sendError("number", ["3", "args", primitiveArgs.length]); return;}
			if(!this.checkNumber(primitiveArgs, "args")) return;
			
			if(primitiveArgs[0] <= 0 || primitiveArgs[1] <= 0) {this.sendError("valueLE", ["radius", "0"]); return;}
			if(primitiveArgs[2] < 1) {this.sendError("value", ["stacks", "1"]); return;}
			if(primitiveArgs[1] < 3) {this.sendError("value", ["slices", "3"]); return;}

			this.primitive = new MySphereLeaf(graph.scene, primitiveArgs[0], primitiveArgs[1], primitiveArgs[2]);
		break;
		
		
		/**
		 * Patch handling
		 *
		 */
		case 'patch':
		
			//Get patch arguments
			var argString = graph.reader.getString(xmlelem, 'args');
			if(this.checkNull(argString)) {this.sendError("attribute", "args"); return;}
			
			//Split values into array
			var splitted = this.splitOnWhitespace(argString);
			for(var i = 0; i < splitted.length; i++) {
				primitiveArgs.push(parseFloat(splitted[i]));
			}
			
			//Patch argument validation
			if(this.checkNaN(primitiveArgs)) {this.sendError("NaN", "patch"); return;}
			if(primitiveArgs.length != 2) {this.sendError("number", ["2", "args", primitiveArgs.length]); return;}
			
			for(value of primitiveArgs) {
				if(value < 1) {this.sendError("value", ["patch args", "1"]); return;}
			}
			
			var uDivs = primitiveArgs[0];
			var vDivs = primitiveArgs[1];
		
			//Get the CPLINE nodes
			var cplines = xmlelem.getElementsByTagName("CPLINE");
			if(cplines.length <= 0) {this.sendError("block", ["CPLINE", "patch"]); return;}
			
			var degreeU = cplines.length - 1;
			var cpoints = [];
			
			//Fetch CPOINTs for each CPLINE block, cpoints[0] gives all CPOINTs from a CPLINE, cpoints[0][0] gives the 1st CPOINT from the 1st CPLINE
			for(var i = 0; i < cplines.length; i++) {
				cpoints.push(cplines[i].children);
			}
			
			if(cpoints[0].length <= 0) {this.sendError("block", ["CPOINT", "CPLINE"]); return;}
			
			var degreeV = cpoints[0].length - 1; //Assume length from first CPLINE block
			
			//Check that every CPLINE block has the same amount of CPOINTs
			for(var i = 0; i < cpoints.length; i++) {
				if(cpoints[i].length - 1 != degreeV) {
					this.sendError("other", (degreeV + 1) + " CPOINT lines per CPLINE were inferred but found different number of CPOINT lines on CPLINE block #" + (i + 1) + ".");
					return;
				}
			}
			
			var cpoint_args = []; //1 CPOINT line
			var cpline_args = []; //1 CPLINE block, contains degreeV + 1 CPOINT lines
			var nurbs_args = []; //All the CPLINE blocks, contains degreeU + 1 CPLINE blocks
			
			//Build the final array of control vertices
			for(var i = 0; i < cpoints.length; i++) {
				for (var j = 0; j < degreeV + 1; j++) {
				
					cpoint_args.push(graph.reader.getFloat(cpoints[i][j], 'xx'));
					if(!this.checkNumber(cpoint_args[0], "xx")) return;

					cpoint_args.push(graph.reader.getFloat(cpoints[i][j], 'yy'));
					if(!this.checkNumber(cpoint_args[1], "yy")) return;
										
					cpoint_args.push(graph.reader.getFloat(cpoints[i][j], 'zz'));
					if(!this.checkNumber(cpoint_args[2], "zz")) return;
					
					cpoint_args.push(graph.reader.getFloat(cpoints[i][j], 'ww'));
					if(!this.checkNumber(cpoint_args[3], "ww")) return;
					
					cpline_args.push(cpoint_args); //Push 1 complete CPOINT line
					cpoint_args = [];
				}
				
				nurbs_args.push(cpline_args); //Push 1 complete CPLINE block
				cpline_args = [];
			}

			this.primitive = new MyNURBS(graph.scene, degreeU, degreeV, uDivs, vDivs, nurbs_args);
		break;
	}
}

/**
 *	Sets an error message depending on the format specified
 *	with the message arguments provided
 *
 *	@param format - format of the error message
 *	@param message - message arguments
 */
MyGraphLeaf.prototype.sendError = function(format, message) {
	 
	 switch(format) {
		 case "attribute":
			this.error = "no " + message + " attribute found."
		 break;
		 case "NaN":
			this.error = message + " has at least one NaN value.";
		 break;
		 case "block":
			if(message.length != 2) console.error("Wrong number of arguments for sendError()");
			this.error = "no " + message[0] + " block declared inside " + message[1] + " block.";
		 break;
		 case "number":
			if(message.length != 3) console.error("Wrong number of arguments for sendError()");
			this.error = "expected " + message[0] + " arguments in " + message[1] + " but found " + message[2] + ".";
		 break;
		 case "value":
			if(message.length != 2) console.error("Wrong number of arguments for sendError()");
			this.error = message[0] + " can't have value lower than " + message[1] + ".";
		 break;
		 case "valueLE":
			if(message.length != 2) console.error("Wrong number of arguments for sendError()");
			this.error = message[0] + " can't have value less than or equal to " + message[1] + ".";
		 break;
		 case "valueOR":
			if(message.length != 3) console.error("Wrong number of arguments for sendError()");
			this.error = message[0] + " has to have value of " + message[1] + " or " + message[2] + ".";
		 break;
		 default:
			this.error = message;
		 break;
	 }
}

/**
 *	Trims a string's whitespace at the edges and then splits it on whitespace left
 *
 *	@param string - string to process
 *	@return string - string trimmed and split on whitespace
 */
MyGraphLeaf.prototype.splitOnWhitespace = function(string) {
	 return (string.trim()).split(/[ ]+/);
}

/**
 *	Checks if a value is NaN or null and sets the error message if it is
 *
 *	@param value - value to check
 *	@param message - message arguments if error is found
 *	@return boolean - false if it's NaN or null
 */
MyGraphLeaf.prototype.checkNumber = function(value, message) {
	 
	 if(this.checkNaN(value)) {
		 this.sendError("NaN", message);
		 return false;
	 } else if(this.checkNull(value)) {
		 this.sendError("attribute", message);
		 return false;
	 }
	 
	 return true;
}
 
/**
 *	Checks if a value is NaN
 *
 *	@param value - value or values to check
 *	@return boolean - true if it's NaN
 */
MyGraphLeaf.prototype.checkNaN = function(value) {
	 
	 if(Array.isArray(value)) {
		for(var i = 0; i < value.length; i++) {
			 
			 if(isNaN(value[i])) return true;
		 }
	 } else if(isNaN(value)) return true;
	 
	 return false;
}
 
/**
 *	Checks if a value is null
 *
 *	@param value - value or values to check
 *	@return boolean - true if it's null
 */
MyGraphLeaf.prototype.checkNull = function(value) {
	 
	 if(Array.isArray(value)) {
		 for(var i = 0; i < value.length; i++) {
			 
			 if(value[i] == null) return true;
		 }
	 } else if(value == null) return true;
	 
	 return false;
}