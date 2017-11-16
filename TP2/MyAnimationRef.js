/**
 * MyAnimationRef
 *
 * Class for holding status of animations for each node
 */
function MyAnimationRef(animationRefs) {
	
	this.currAnimTime = 0; //Absolute time of current animation in milliseconds
	this.currAnimIndex = 0; //Index to animationRefs for current animation
	this.cumulativeTransform = mat4.create(); //Transformation matrix of all the previous animations for this node
	this.transformMatrix = mat4.create(); //Current transformation matrix
	this.animationRefs = animationRefs; //
	
	this.finished = false;
};

MyAnimationRef.prototype.constructor = MyAnimationRef;

MyAnimationRef.prototype.update = function(deltaT) {
	
	this.currAnimTime += deltaT;
	
	
	this.transformMatrix = this.animationRefs[this.currAnimIndex].getAnimationMatrix(this.currAnimTime);
	
	
}