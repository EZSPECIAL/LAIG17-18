/**
 * MyGraphLeaf class, representing a leaf in the scene graph.
 * @constructor
**/

function MyGraphLeaf(graph, xmlelem, type) {
	
	this.primitive = null;
	
	var coords = [];
	var errorCheck;

	switch(type) {
		case 'triangle':

			var argString = graph.reader.getString(xmlelem, 'args', errorCheck);
			var splitted = argString.split(' ');
			
			for(var i = 0; i < splitted.length; i++) {
				coords.push(parseFloat(splitted[i]));
			}
			
			this.primitive = new MyTriangleLeaf(graph.scene, coords);

		break;
		case 'rectangle':
			
			var argString = graph.reader.getString(xmlelem, 'args', errorCheck);
			var splitted = argString.split(' ');
			
			for(var i = 0; i < splitted.length; i++) {
				coords.push(parseFloat(splitted[i]));
			}
			
			this.primitive = new MyQuadLeaf(graph.scene, coords);

		break;
		case 'cylinder':
			
			var argString = graph.reader.getString(xmlelem, 'args', errorCheck);
			var splitted = argString.split(' ');
			
			for(var i = 0; i < splitted.length; i++) {
				coords.push(parseFloat(splitted[i]));
			}
			
			this.primitive = new MyCylinderLeaf(graph.scene, coords);

		break;
			
	}
	
}