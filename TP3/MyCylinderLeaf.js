/**
 * MyCylinderLeaf
 *
 * Constructs a cylinder with parameters loaded from a XML scene file.
 */
 function MyCylinderLeaf(scene, height, baseRadius, topRadius, stacks, slices, topLid, botLid) {
	 
	CGFobject.call(this,scene);
	
	this.height = height;
	this.baseRadius = baseRadius;
	this.topRadius = topRadius;
	this.topLid = topLid;
	this.botLid = botLid;
	
	this.cylinder = new MyCylinder(this.scene, height, baseRadius, topRadius, stacks, slices);
	this.lid = new MyCircle(this.scene, slices);
 };

 MyCylinderLeaf.prototype = Object.create(CGFobject.prototype);
 MyCylinderLeaf.prototype.constructor = MyCylinderLeaf;

 MyCylinderLeaf.prototype.display = function() {
	 
	 if(this.botLid) {
		 this.scene.pushMatrix();
		 this.scene.scale(this.baseRadius, this.baseRadius, 1.0);
		 this.scene.rotate(Math.PI, 1, 0, 0);
		 this.lid.display();
		 this.scene.popMatrix();
	 }
	 
	 if(this.topLid) {
		 this.scene.pushMatrix();
		 this.scene.translate(0.0, 0.0, this.height);
		 this.scene.scale(this.topRadius, this.topRadius, 1.0);
		 this.lid.display();
		 this.scene.popMatrix();
	 }

	 this.cylinder.display();
};