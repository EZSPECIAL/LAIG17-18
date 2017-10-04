/**
 * MyCylinderLeaf
 *
 * Constructs a cylinder with parameters loaded from XML scene file.
 */
 function MyCylinderLeaf(scene, coords) {
 	CGFobject.call(this,scene);

	this.height = coords[0];
	this.botRadius = coords[1];
	this.topRadius = coords[2];
	this.stacks = coords[3];
	this.slices = coords[4];
	this.incRadiusValue = (this.botRadius - this.topRadius)/this.stacks;  //value to increment/decrement height for each stack
	

	/*this.bothsides = bothsides || 0; To make normals for both sides (inside/outside)*/


 	this.initBuffers();
 };

 MyCylinderLeaf.prototype = Object.create(CGFobject.prototype);
 MyCylinderLeaf.prototype.constructor = MyCylinderLeaf;

 MyCylinderLeaf.prototype.initBuffers = function() {

 	var newCoords = [];
	var newNormals = [];
	var newIndices = [];
	var newTexCoords = [];

	var newHeight = this.botRadius; //variable to calculate cyclinder height for each stack
	var ang = 2*Math.PI/this.slices; //angle for each slice
	
  /* cylinder construction*/
	 
  for(let i=0; i<=this.stacks; i++)
  {
    for(let j=0; j<=this.slices; j++)
    {
		
		newCoords.push(Math.cos(j*ang)*newHeight, Math.sin(j*ang)*newHeight, i*this.height/this.stacks);
     	newNormals.push(Math.cos(j*ang), Math.sin(j*ang), Math.sin(Math.atan(Math.abs(this.topRadius-this.botRadius)/this.height)));
		newTexCoords.push(2 * j / this.slices, 2 * i / this.stacks);

    }
	  
	newHeight = newHeight - this.incRadiusValue;

  }
	

  this.vertices = newCoords;
  this.normals = newNormals;
  this.texCoords = newTexCoords;

  for(let i=0; i<this.stacks; i++)
  {
    for(let j=0; j<this.slices; j++){

      newIndices.push(i*(this.slices+1)+j, i*(this.slices+1)+1+j, (i+1)*(this.slices+1)+1+j);
      newIndices.push(i*(this.slices+1)+j, (i+1)*(this.slices+1)+1+j, (i+1)*(this.slices+1)+j);
    }

  }
  
  	
	this.indices = newIndices;
  
  
  /*
  Both sides ilumination
  
  
  if(this.bothsides == 1)
  {
    for(let i=0; i<this.slices*this.stacks; i++)
    {
      if((i+1)%this.slices == 0)
      {
        this.indices.push(i+1, i+1-this.slices, i);
      this.indices.push(i+this.slices, i+1, i);
      }
      else
      {
      this.indices.push(i+this.slices+1, i+1, i);
      this.indices.push(i+this.slices, i+this.slices+1, i);
		}
	}
  }*/

 	this.primitiveType = this.scene.gl.TRIANGLES;
 	this.initGLBuffers();
 };