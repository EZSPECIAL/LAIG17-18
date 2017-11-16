/**
 * MyQuadLeaf
 *
 * Constructs a quad with parameters loaded from a XML scene file.
 */
function MyQuadLeaf(scene, topLeft, botRight) {
	
	CGFobject.call(this, scene);
	
	var botLeft = [topLeft[0], botRight[1], 0];
	var topRight = [botRight[0], topLeft[1], 0];
	
	this.height = topLeft[1] - botLeft[1];
	this.width = topRight[0] - topLeft[0];
	
	var tempCoords = [topLeft, botLeft, botRight, topRight];
	var coords = [];
	
	for(var i = 0; i < tempCoords.length; i++) {
		for(var j = 0; j < tempCoords[i].length; j++) {
			
			coords.push(tempCoords[i][j]);
		}
	}

	this.vertices = coords;
	this.origTexCoords = [];
	
	this.initBuffers();
};

MyQuadLeaf.prototype = Object.create(CGFobject.prototype);
MyQuadLeaf.prototype.constructor = MyQuadLeaf;

MyQuadLeaf.prototype.updateTexCoords = function(sFactor, tFactor) {
	
	
	for(var i = 0; i < this.texCoords.length; i+=2) {
		
		this.texCoords[i] = this.origTexCoords[i] * (this.width / (sFactor));
		this.texCoords[i + 1] = this.origTexCoords[i + 1] * (this.height / (tFactor));

	}
	
	this.updateTexCoordsGLBuffers();
}

MyQuadLeaf.prototype.initBuffers = function() {
	
	this.normals = [];
	
	for(var i = 0; i < this.vertices.length; i+=3) {
		
		this.normals.push(0);
		this.normals.push(0);
		this.normals.push(1);
	}
	
	this.texCoords = [ 0, 0,
		               0, 1,
		               1, 1,
		               1, 0 ];

	this.origTexCoords = this.texCoords.slice();

	this.indices = [ 0, 1, 2,
					 0, 2, 3 ];
	
	this.primitiveType = this.scene.gl.TRIANGLES;
	this.initGLBuffers();
};