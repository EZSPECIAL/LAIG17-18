/**
 * MySphereLeaf
 *
 * Constructs a sphere with parameters loaded from a XML scene file.
 */
function MySphereLeaf(scene, radius, slices, stacks) {
	
	CGFobject.call(this, scene);

	this.radius = radius;
	
	this.sphere = new MySphere(this.scene, slices, stacks);
};

MySphereLeaf.prototype = Object.create(CGFobject.prototype);
MySphereLeaf.prototype.constructor = MySphereLeaf;

MySphereLeaf.prototype.display = function() {
	
	this.scene.pushMatrix();
	this.scene.scale(this.radius, this.radius, this.radius);
	this.sphere.display();
	this.scene.popMatrix();
};