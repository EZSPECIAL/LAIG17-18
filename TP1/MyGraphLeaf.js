/**
 * MyGraphLeaf class, representing a leaf in the scene graph.
 * @constructor
**/

function MyGraphLeaf(graph, xmlelem, type) {
	
	this.primitive = null;
	this.type = type;
	this.error = null;
	
	var primitiveArgs = [];
	var errorCheck;

	switch(type) {
		case 'triangle':

			var argString = graph.reader.getString(xmlelem, 'args', errorCheck);
			
			if(argString == null) {
				this.error = "no args attribute found.";
				return;
			}
			
			var splitted = argString.split(' ');
			
			for(var i = 0; i < splitted.length; i++) {
				primitiveArgs.push(parseFloat(splitted[i]));
			}
			
			this.primitive = new MyTriangleLeaf(graph.scene, primitiveArgs);

		break;
		case 'rectangle':
			
			var argString = graph.reader.getString(xmlelem, 'args', errorCheck);
			
			if(argString == null) {
				this.error = "no args attribute found.";
				return;
			}
			
			var splitted = argString.split(' ');
			
			for(var i = 0; i < splitted.length; i++) {
				primitiveArgs.push(parseFloat(splitted[i]));
			}
			
			this.primitive = new MyQuadLeaf(graph.scene, [primitiveArgs[0], primitiveArgs[1], 0], [primitiveArgs[2], primitiveArgs[3], 0]);

		break;
		case 'cylinder':
			
			var argString = graph.reader.getString(xmlelem, 'args', errorCheck);
			
			if(argString == null) {
				this.error = "no args attribute found.";
				return;
			}
			
			var splitted = argString.split(' ');
			
			for(var i = 0; i < splitted.length; i++) {
				primitiveArgs.push(parseFloat(splitted[i]));
			}
			
			this.primitive = new MyCylinderLeaf(graph.scene, primitiveArgs[0], primitiveArgs[1], primitiveArgs[2], primitiveArgs[3], primitiveArgs[4], primitiveArgs[5], primitiveArgs[6]);

		break;
		case 'sphere':
		
			var argString = graph.reader.getString(xmlelem, 'args', errorCheck);
			
			if(argString == null) {
				this.error = "no args attribute found.";
				return;
			}
			
			var splitted = argString.split(' ');
			
			for(var i = 0; i < splitted.length; i++) {
				primitiveArgs.push(parseFloat(splitted[i]));
			}
			
			this.primitive = new MySphereLeaf(graph.scene, primitiveArgs[0], primitiveArgs[1], primitiveArgs[2]);
		break;
		case 'patch':
		
			var argString = graph.reader.getString(xmlelem, 'args', errorCheck);
			
			if(argString == null) {
				this.error = "no args attribute found.";
				return;
			}
			
			var splitted = argString.split(' ');
			
			for(var i = 0; i < splitted.length; i++) {
				primitiveArgs.push(parseFloat(splitted[i]));
			}
			
			if(primitiveArgs.length != 2) {
				this.error = "wrong number of arguments, expected 2, got " + primitiveArgs.length + ".";
				return;
			}
			
			var uDivs = primitiveArgs[0];
			var vDivs = primitiveArgs[1];
		
			var cplines = xmlelem.getElementsByTagName("CPLINE");
			
			if(cplines.length <= 0) {
				this.error = "no CPLINE block declared inside patch block.";
				return;
			}
			
			var degreeU = cplines.length - 1;

			var cpoints = [];
			
			for(var i = 0; i < cplines.length; i++) {
				
				cpoints.push(cplines[i].children);
			}
			
			if(cpoints[0].length <= 0) {
				this.error = "no CPOINT block declared inside CPLINE block.";
				return;
			}
			
			var degreeV = cpoints[0].length - 1; //Assume length from first CPLINE block
		
			for(var i = 0; i < cpoints.length; i++) {
				if(cpoints[i].length - 1 != degreeV) {
					this.error = (degreeV + 1) + " CPOINT lines per CPLINE were inferred but found different number of CPOINT lines on CPLINE block #" + (i + 1) + ".";
					return;
				}
			}
			
			var cpoint_args = [];
			var cpline_args = [];
			var nurbs_args = [];
			
			for(var i = 0; i < cpoints.length; i++) {
				for (var j = 0; j < degreeV + 1; j++) {
				
					cpoint_args.push(graph.reader.getFloat(cpoints[i][j], 'xx', errorCheck));
					cpoint_args.push(graph.reader.getFloat(cpoints[i][j], 'yy', errorCheck));
					cpoint_args.push(graph.reader.getFloat(cpoints[i][j], 'zz', errorCheck));
					cpoint_args.push(graph.reader.getFloat(cpoints[i][j], 'ww', errorCheck));
					cpline_args.push(cpoint_args);
					cpoint_args = [];
				}
				
				nurbs_args.push(cpline_args);
				cpline_args = [];
			}

			this.primitive = new MyNURBS(graph.scene, degreeU, degreeV, uDivs, vDivs, nurbs_args);
		break;
	}
}