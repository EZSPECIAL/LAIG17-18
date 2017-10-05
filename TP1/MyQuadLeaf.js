/**
 * MyQuadLeaf
 *
 * Constructs a quad with parameters loaded from a XML scene file.
 */
function MyQuadLeaf(scene, coords) {
	
	CGFobject.call(this, scene);
	
	var botLeft = [coords[0], coords[3], 0];
	var topRight = [coords[2], coords[1], 0];
	var newCoords = [coords[0], coords[1], 0];
	newCoords.push(botLeft[0]);
	newCoords.push(botLeft[1]);
	newCoords.push(botLeft[2]);
	newCoords.push(coords[2]);
	newCoords.push(coords[3]);
	newCoords.push(0);
	newCoords.push(topRight[0]);
	newCoords.push(topRight[1]);
	newCoords.push(topRight[2]);
	
	this.vertices = newCoords;
	
	this.initBuffers();
};

MyQuadLeaf.prototype = Object.create(CGFobject.prototype);
MyQuadLeaf.prototype.constructor = MyQuadLeaf;

MyQuadLeaf.prototype.initBuffers = function() {
	
	var vec3Normals = [];
	
	for(var i = 0; i < this.vertices.length - 3; i+=3) {
		
		vec3Normals.push(vec3.fromValues(this.vertices[i], this.vertices[i+1], this.vertices[i+2]));
	}
	
	var firstVector = vec3.create();
	var secondVector = vec3.create();
	
	vec3.subtract(firstVector, vec3Normals[2], vec3Normals[1]);
	vec3.subtract(secondVector, vec3Normals[0], vec3Normals[1]);

	var normalOut = vec3.create();
	
	vec3.cross(normalOut, firstVector, secondVector);
	vec3.normalize(normalOut, normalOut);

	var normals = [];
	
	for(var i = 0; i < this.vertices.length; i+=3) {
		
		normals.push(normalOut[0]);
		normals.push(normalOut[1]);
		normals.push(normalOut[2]);
	}
	
	this.normals = normals;
	
	/*this.texCoords = [ this.minS, this.maxT,
		               this.maxS, this.maxT,
		               this.minS, this.minT,
		               this.maxS, this.minT ];*/

	this.indices = [ 0, 1, 2,
					 0, 2, 3];
	
	this.primitiveType = this.scene.gl.TRIANGLES;
	this.initGLBuffers();
};