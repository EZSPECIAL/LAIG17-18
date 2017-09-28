/**
 * MyTriangleLeaf
 *
 * Constructs a triangle with parameters specified by XML file
 */
function MyTriangleLeaf(scene, coords) {
	
	CGFobject.call(this, scene);

	this.vertices = coords;
	
	this.initBuffers();
};

MyTriangleLeaf.prototype = Object.create(CGFobject.prototype);
MyTriangleLeaf.prototype.constructor = MyTriangleLeaf;

MyTriangleLeaf.prototype.initBuffers = function() {
	
	// this.vertices = [ -0.5, -0.5, 0.0,
					  // 0.5, -0.5, 0.0,
					  // -0.5, 0.5, 0.0,
					  // 0.5, 0.5, 0.0 ];
					  
	// this.normals = [ 0, 0, 1,
		             // 0, 0, 1,
		             // 0, 0, 1,
		             // 0, 0, 1 ];
	
	// this.texCoords = [ this.minS, this.maxT,
		               // this.maxS, this.maxT,
		               // this.minS, this.minT,
		               // this.maxS, this.minT ];

	this.indices = [ 0, 1, 2 ];
		
	this.primitiveType = this.scene.gl.TRIANGLES;
	this.initGLBuffers();
};