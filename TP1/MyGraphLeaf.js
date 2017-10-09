/**
 * MyGraphLeaf class, representing a leaf in the scene graph.
 * @constructor
**/

function MyGraphLeaf(graph, xmlelem, type) {
	
	this.primitive = null;
	this.type = type;
	
	var primitiveArgs = [];
	var errorCheck;

	switch(type) {
		case 'triangle':

			var argString = graph.reader.getString(xmlelem, 'args', errorCheck);
			var splitted = argString.split(' ');
			
			for(var i = 0; i < splitted.length; i++) {
				primitiveArgs.push(parseFloat(splitted[i]));
			}
			
			this.primitive = new MyTriangleLeaf(graph.scene, primitiveArgs);

		break;
		case 'rectangle':
			
			var argString = graph.reader.getString(xmlelem, 'args', errorCheck);
			var splitted = argString.split(' ');
			
			for(var i = 0; i < splitted.length; i++) {
				primitiveArgs.push(parseFloat(splitted[i]));
			}
			
			this.primitive = new MyQuadLeaf(graph.scene, [primitiveArgs[0], primitiveArgs[1], 0], [primitiveArgs[2], primitiveArgs[3], 0]);

		break;
		case 'cylinder':
			
			var argString = graph.reader.getString(xmlelem, 'args', errorCheck);
			var splitted = argString.split(' ');
			
			for(var i = 0; i < splitted.length; i++) {
				primitiveArgs.push(parseFloat(splitted[i]));
			}
			
			this.primitive = new MyCylinderLeaf(graph.scene, primitiveArgs[0], primitiveArgs[1], primitiveArgs[2], primitiveArgs[3], primitiveArgs[4]);

		break;
		case 'sphere':
		
			var argString = graph.reader.getString(xmlelem, 'args', errorCheck);
			var splitted = argString.split(' ');
			
			for(var i = 0; i < splitted.length; i++) {
				primitiveArgs.push(parseFloat(splitted[i]));
			}
			
			this.primitive = new MySphereLeaf(graph.scene, primitiveArgs[0], primitiveArgs[1], primitiveArgs[2]);
		break;
	}
}