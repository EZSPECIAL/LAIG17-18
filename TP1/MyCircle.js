/**
 * MyCircle
 * 
 * Constructs a circle on the XY plane centered on the origin.
 */
function MyCircle(scene, slices) {
	
	CGFobject.call(this,scene);

	this.slices = slices;
	this.initBuffers();
};

MyCircle.prototype = Object.create(CGFobject.prototype);
MyCircle.prototype.constructor = MyCircle;

MyCircle.prototype.initBuffers = function() {

	var vertices = [];
	var normals = [];
	var texCoords = [];
	var indices = [];
	var increment = 2 * Math.PI / this.slices;

	//Center of circle first (for TRIANGLE_FAN)
	vertices.push(0, 0, 0);
	normals.push(0, 0, 1);
	texCoords.push(0.5, 0.5);
	
	for(var i = 0; i < this.slices; i++) {
		vertices.push(Math.cos(increment * i), Math.sin(increment * i), 0);
		normals.push(Math.cos(increment * i), Math.sin(increment * i), 0);
		texCoords.push(Math.cos(increment * i) * 0.5 + 0.5, -Math.sin(increment * i) * 0.5 + 0.5);
	}

	for(var i = 0; i <= this.slices; i++) {
		indices.push(i);
	}
	
	indices.push(1); //Close the TRIANGLE_FAN
	
	this.vertices = vertices;
	this.normals = normals;
	this.texCoords = texCoords;
	this.indices = indices;

	this.primitiveType = this.scene.gl.TRIANGLE_FAN;
	this.initGLBuffers();
};