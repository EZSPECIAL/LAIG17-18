/**
 * MyGraphLeaf class, representing a leaf in the scene graph.
 * @constructor
**/

function MyGraphLeaf(graph, xmlelem, type) {
	
	this.primitive = null;
	
	// var type=graph.reader.getItem(xmlelem, 'type', ['rectangle', 'cylinder', 'sphere', 'triangle']);

	

	switch(type) {
		case 'triangle':
			var coords = [];
			var errorCheck;
			var argString = graph.reader.getString(xmlelem, 'args', errorCheck);
			var splitted = argString.split(' ');
			// for(var i = 0; i < splitted.length; i+=3) {
				// coords.push(vec3.fromValues(
				// parseFloat(splitted[i]),
				// parseFloat(splitted[i+1]),
				// parseFloat(splitted[i+2])));
			// }
			
			for(var i = 0; i < splitted.length; i++) {
				coords.push(parseFloat(splitted[i]));
			}
			// console.log("VEC3:" + coords[0]);
			// console.log("VEC3:" + coords[1]);
			// console.log("VEC3:" + coords[2]);
			
			this.primitive = new MyTriangleLeaf(graph.scene, coords);

			// for(var i = 0; i < lines.length; i++) 
			// for(int i 
			// console.log("COORDS:" + coords);
		break;
	}
	
}