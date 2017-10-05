/**
 * MySphereLeaf
 *
 * Constructs a sphere with parameters loaded from a XML scene file.
 */
function MySphereLeaf(scene, radius, slices, stacks) {
	
	CGFobject.call(this, scene);

	this.radius = radius;
	
	this.hemiSphere = new MyHemiSphere(this.scene, slices, stacks / 2.0, 1, 1);
};

MySphereLeaf.prototype = Object.create(CGFobject.prototype);
MySphereLeaf.prototype.constructor = MySphereLeaf;

MySphereLeaf.prototype.display = function() {
	
	this.scene.pushMatrix();
	
	this.scene.rotate(Math.PI / 2.0, 1, 0, 0);
	this.scene.scale(this.radius, this.radius, this.radius);
	this.hemiSphere.display();
	
	this.scene.popMatrix();
	
	this.scene.pushMatrix();
	
	this.scene.rotate(Math.PI / 2.0, -1, 0, 0);
	this.scene.scale(this.radius, this.radius, this.radius);
	this.hemiSphere.display();
	
	this.scene.popMatrix();
};