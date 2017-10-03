/**
 * MyLamp
 *
 * Constructs a unit hemisphere resting on the XZ plane centered on the Y axis.
 */
function MyLamp(scene, slices, stacks, texH, texV) {
	
	CGFobject.call(this,scene);

	texH = typeof texH !== 'undefined' ? texH : 1.0;
	texV = typeof texV !== 'undefined' ? texV : 1.0;
	
	this.slices = slices;
	this.stacks = stacks;
	this.texH = texH;
	this.texV = texV;

	this.initBuffers();
};

MyLamp.prototype = Object.create(CGFobject.prototype);
MyLamp.prototype.constructor = MyLamp;

MyLamp.prototype.initBuffers = function() {

	var vertices = [];
	var normals = [];
	var texCoords = [];
	var indices = [];
	var phi_inc = 2 * Math.PI / this.slices;
	var theta_inc = Math.PI / 2 / this.stacks;

	//Repeats top vertex info for each slice
	for(var i = 0; i <= this.slices; i++) {
		for(var j = 0; j <= this.stacks; j++) {
			vertices.push(Math.sin(theta_inc * j) * Math.cos(phi_inc * i), Math.cos(theta_inc * j), Math.sin(theta_inc * j) * Math.sin(phi_inc * i));
			normals.push(Math.sin(theta_inc * j) * Math.cos(phi_inc * i), Math.cos(theta_inc * j), Math.sin(theta_inc * j) * Math.sin(phi_inc * i));
			texCoords.push(this.texH * i / this.slices, 1 - this.texV * j / this.stacks);
		}
	}

	for(var i = 0; i < this.slices; i++) {
		var i_inc = (this.stacks + 1) * i;
		for(var j = 0; j < this.stacks; j++) {
			indices.push(i_inc + j);
			indices.push(i_inc + j + (this.stacks + 1) + 1);
			indices.push(i_inc + j + 1);

			indices.push(i_inc + j + (this.stacks + 1));
			indices.push(i_inc + j + (this.stacks + 1) + 1);
			indices.push(i_inc + j);
		}
	}

	this.vertices = vertices;
	this.normals = normals;
	this.texCoords = texCoords;
	this.indices = indices;

	this.primitiveType = this.scene.gl.TRIANGLES;
	this.initGLBuffers();
};