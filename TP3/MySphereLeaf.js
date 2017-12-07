/**
 * MySphereLeaf
 *
 * Constructs a sphere with parameters loaded from a XML scene file.
 */
function MySphereLeaf(scene, radius, slices, stacks) {
	
  CGFobject.call(this, scene);

  this.radius = radius;
  this.slices = slices;
  this.stacks = stacks;

  this.initBuffers();
};

MySphereLeaf.prototype = Object.create(CGFobject.prototype);
MySphereLeaf.prototype.constructor = MySphereLeaf;

MySphereLeaf.prototype.initBuffers = function () {

  this.vertices = [];
  this.normals = [];
  this.texCoords = [];

  var ang = 2.0 * Math.PI / this.slices;
  var angz = (Math.PI / 2.0) / this.stacks;
  
  //North hemisphere
  for (var i = 0; i <= this.stacks; i++) {
    for (var j = 0; j <= this.slices; j++) {
		
      this.vertices.push(Math.cos(j * ang) * Math.cos(i * angz) * this.radius, Math.sin(j * ang) * Math.cos(i * angz) * this.radius, Math.sin(i * angz) * this.radius); //Start at Z = 0 and go up to Z = radius
      this.normals.push(Math.cos(j * ang) * Math.cos(i * angz), Math.sin(j * ang) * Math.cos(i * angz), Math.sin(i * angz));
      this.texCoords.push(j / this.slices, 0.5 - (i / this.stacks / 2.0)); //S wraps around from 0 to 1 per stack, T starts at 0.5 and goes down to 0
    }
  }
  
  //South hemisphere
  for (var i = 0; i <= this.stacks; i++) {
    for (var j = 0; j <= this.slices; j++) {
		
      this.vertices.push(Math.cos(j * ang) * Math.cos(i * angz) * this.radius, Math.sin(j * ang) * Math.cos(i * angz) * this.radius, (-Math.sin(i * angz)) * this.radius); //Start at Z = 0 and go down to Z = -radius
      this.normals.push(Math.cos(j * ang) * Math.cos(i * angz), Math.sin(j * ang) * Math.cos(i * angz), -Math.sin(i * angz));
      this.texCoords.push(j / this.slices, 0.5 + (i / this.stacks / 2.0)); //S wraps around from 0 to 1 per stack, T starts at 0.5 and goes up to 1
    }
  }
  
  this.indices = [];

  //North hemisphere
  for (var i = 0; i < this.stacks; i++) {
    for (var j = 0; j < this.slices; j++) {

      this.indices.push(i * (this.slices + 1) + j, i * (this.slices + 1) + 1 + j, (i + 1) * (this.slices + 1) + 1 + j);
      this.indices.push(i * (this.slices + 1) + j, (i + 1) * (this.slices + 1) + 1 + j, (i + 1) * (this.slices + 1) + j);
    }
  }

  //South hemisphere
   for (var i = this.stacks + 1; i < (this.stacks * 2.0) + 1; i++) {
    for (var j = 0; j < this.slices; j++) {

	  this.indices.push(i * (this.slices + 1) + j, (i + 1) * (this.slices + 1) + 1 + j, i * (this.slices + 1) + 1 + j);
	  this.indices.push(i * (this.slices + 1) + j, (i + 1) * (this.slices + 1) + j, (i + 1) * (this.slices + 1) + 1 + j);
    }
  }

  this.primitiveType = this.scene.gl.TRIANGLES;
  this.initGLBuffers();
};
