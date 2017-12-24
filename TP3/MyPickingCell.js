/**
 * MyPickingCell
 *
 * Constructs a square picking cell on the XZ plane
 */
function MyPickingCell(scene, topLeft, botRight) {
	
	CGFobject.call(this, scene);
	
	var botLeft = [topLeft[0], topLeft[1], botRight[2]];
	var topRight = [botRight[0], botRight[1], topLeft[2]];
	
	var tempCoords = [topLeft, botLeft, botRight, topRight];
	var coords = [];
	
	for(var i = 0; i < tempCoords.length; i++) {
		for(var j = 0; j < tempCoords[i].length; j++) {
			
			coords.push(tempCoords[i][j]);
		}
	}

	this.vertices = coords;
	
	this.initBuffers();
};

MyPickingCell.prototype = Object.create(CGFobject.prototype);
MyPickingCell.prototype.constructor = MyPickingCell;

MyPickingCell.prototype.initBuffers = function() {
	
	this.normals = [];
	
	for(var i = 0; i < this.vertices.length; i+=3) {
		
		this.normals.push(0);
		this.normals.push(1);
		this.normals.push(0);
	}
	
	this.texCoords = [ 0, 0,
		               0, 1,
		               1, 1,
		               1, 0 ];

	this.indices = [ 0, 1, 2,
					 0, 2, 3 ];
	
	this.primitiveType = this.scene.gl.TRIANGLES;
	this.initGLBuffers();
};