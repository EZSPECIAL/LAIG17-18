/**
 * MyCylinder
 *
 * Constructs a cylinder, cone or cone section with base on the XY plane and axis along Z+.
 */
 function MyCylinder(scene, height, baseRadius, topRadius, stacks, slices) {
	 
	CGFobject.call(this,scene);

	this.height = height;
	this.baseRadius = baseRadius;
	this.topRadius = topRadius;
	this.stacks = stacks;
	this.slices = slices;
	this.radiusInc = (this.baseRadius - this.topRadius) / this.stacks; //value to increment radius per stack, =0 if cylinder

	this.initBuffers();
 };

 MyCylinder.prototype = Object.create(CGFobject.prototype);
 MyCylinder.prototype.constructor = MyCylinder;

 MyCylinder.prototype.initBuffers = function() {

	var coords = [];
	var normals = [];
	var indices = [];
	var texCoords = [];

	var circumference = 2 * Math.PI * this.baseRadius; //texCoord s factor
	
	var deltaRadius = this.baseRadius - this.topRadius;
    var length = Math.sqrt(deltaRadius * deltaRadius + this.height * this.height);
	var zNormal = deltaRadius / length; //cone slope, =0 if cylinder
	
	var currRadius = this.baseRadius; //radius of current circle
	var angle = 2 * Math.PI / this.slices;

	for(var i = 0; i <= this.stacks; i++) {
		for(var j = 0; j <= this.slices; j++) {
		
			coords.push(Math.cos(j * angle) * currRadius, Math.sin(j * angle) * currRadius, i * this.height / this.stacks);
			normals.push(Math.cos(j * angle), Math.sin(j * angle), zNormal);
			texCoords.push(circumference * j / this.slices, this.height * i / this.stacks);
		}
		
		currRadius -= this.radiusInc;
	}

	this.vertices = coords;
	this.normals = normals;
	this.texCoords = texCoords;

	for(var i = 0; i < this.stacks; i++) {
		for(var j = 0; j < this.slices; j++) {
		
		indices.push(i * (this.slices + 1) + j, i * (this.slices + 1) + 1 + j, (i + 1) * (this.slices + 1) + 1 + j);
		indices.push(i * (this.slices + 1) + j, (i + 1) * (this.slices + 1) + 1 + j, (i + 1) * (this.slices + 1) + j);
		}
	}

	this.indices = indices;

	this.primitiveType = this.scene.gl.TRIANGLES;
	this.initGLBuffers();
};