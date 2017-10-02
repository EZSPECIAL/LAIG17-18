/**
 * MyTriangleLeaf
 *
 * Constructs a triangle with parameters loaded from XML scene file.
 */
function MyTriangleLeaf(scene, coords) {
	
	CGFobject.call(this, scene);
	
	this.vertices = coords;
	this.initBuffers();
};

MyTriangleLeaf.prototype = Object.create(CGFobject.prototype);
MyTriangleLeaf.prototype.constructor = MyTriangleLeaf;

MyTriangleLeaf.prototype.initBuffers = function() {
	
	var vec3Normals = [];
	
	for(var i = 0; i < this.vertices.length; i+=3) {
		
		vec3Normals.push(vec3.fromValues(this.vertices[i], this.vertices[i+1], this.vertices[i+2]));
	}
	
	var normalOut = vec3.create();
	
	vec3.cross(normalOut, vec3Normals[0], vec3Normals[1]);
	vec3.normalize(normalOut, normalOut);

	var normals = [];
	
	for(var i = 0; i < this.vertices.length; i+=3) {
		
		normals.push(normalOut[0]);
		normals.push(normalOut[1]);
		normals.push(normalOut[2]);
	}
	
	this.normals = normals;
	
	// this.texCoords = [ this.minS, this.maxT,
		               // this.maxS, this.maxT,
		               // this.minS, this.minT,
		               // this.maxS, this.minT ];

	this.indices = [ 0, 1, 2 ];
		
	this.primitiveType = this.scene.gl.TRIANGLES;
	this.initGLBuffers();
};