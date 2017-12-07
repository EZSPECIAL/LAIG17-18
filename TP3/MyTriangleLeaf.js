/**
 * MyTriangleLeaf
 *
 * Constructs a triangle with parameters loaded from a XML scene file.
 */
function MyTriangleLeaf(scene, coords) {
	
	CGFobject.call(this, scene);

	this.vertices = coords;
	this.initBuffers();
};

MyTriangleLeaf.prototype = Object.create(CGFobject.prototype);
MyTriangleLeaf.prototype.constructor = MyTriangleLeaf;

MyTriangleLeaf.prototype.updateTexCoords = function(sFactor, tFactor) {
	
    this.texCoords = [];
	this.texCoords.push(0, 1);
	this.texCoords.push(this.base / sFactor, 1);
	this.texCoords.push((this.distC - this.distA * Math.cos(this.angle)) / sFactor, (tFactor - this.height) / tFactor);

	this.updateTexCoordsGLBuffers();
}

//Calculates triangle base, height and side lengths for usage on texture coord scaling
MyTriangleLeaf.prototype.calcTexConstants = function() {
	
	this.distA = vec3.distance(this.vec3Vertices[1], this.vec3Vertices[2]);
	this.distB = vec3.distance(this.vec3Vertices[0], this.vec3Vertices[2]);
	this.distC = vec3.distance(this.vec3Vertices[0], this.vec3Vertices[1]);
	
	var auxVectorA = vec3.create();
	var auxVectorB = vec3.create();
	
	vec3.subtract(auxVectorA, this.vec3Vertices[0], this.vec3Vertices[1]); //Turn length C into a vector
	vec3.subtract(auxVectorB, this.vec3Vertices[2], this.vec3Vertices[1]); //Turn length A into a vector

	this.angle = MyUtility.vec3_angle(auxVectorA, auxVectorB);
	
	this.base = this.distC;
	this.height = this.distA * Math.sin(this.angle);
}

MyTriangleLeaf.prototype.initBuffers = function() {
	
	this.vec3Vertices = [];
	
	for(var i = 0; i < this.vertices.length; i+=3) {
		
		this.vec3Vertices.push(vec3.fromValues(this.vertices[i], this.vertices[i+1], this.vertices[i+2]));
	}
	
	this.calcTexConstants();
	
	var normalOut = vec3.create();
	var auxVectorA = vec3.create();
	var auxVectorB = vec3.create();
	
	vec3.subtract(auxVectorA, this.vec3Vertices[2], this.vec3Vertices[1]); //Turn length A into a vector
	vec3.subtract(auxVectorB, this.vec3Vertices[0], this.vec3Vertices[1]); //Turn length C into a vector
	
	vec3.cross(normalOut, auxVectorA, auxVectorB);
	vec3.normalize(normalOut, normalOut);

	var normals = [];
	
	for(var i = 0; i < this.vertices.length; i+=3) {
		
		normals.push(normalOut[0]);
		normals.push(normalOut[1]);
		normals.push(normalOut[2]);
	}
	
	this.normals = normals;

	this.indices = [ 0, 1, 2 ];
	
	this.primitiveType = this.scene.gl.TRIANGLES;
	this.initGLBuffers();
};