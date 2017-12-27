/**
 * MyAnimationHandler
 *
 * Class for holding status of animations for each node
 */
function MyAnimationHandler(animationRefs, isIdentity) {
	
	this.currAnimTime = 0; //Absolute time of current animation in milliseconds
	this.currAnimIndex = 0; //Index to animationRefs for current animation
	this.transformMatrix = mat4.create(); //Current transformation matrix
	this.animationRefs = animationRefs; //MyAnimation objects to use for animating

	//Starts animation as finished for nodes that don't have <ANIMATIONREFS>
	if(isIdentity) this.finished = true;
	else this.finished = false;
};

MyAnimationHandler.prototype.constructor = MyAnimationHandler;

/**
 * Updates transformation matrix depending on current animation index, also updates flags
 * for proceeding to next animation or ending this animation.
 *
 * @param deltaT - time in milliseconds since last update
 */
MyAnimationHandler.prototype.update = function(deltaT) {
	
	if(this.finished) return;

	//Update time and get current animation transform matrix
	this.currAnimTime += deltaT;
	this.transformMatrix = this.animationRefs[this.currAnimIndex].getAnimationMatrix(this.currAnimTime);
	
	//Check if current animation ended
	let ended = this.animationRefs[this.currAnimIndex].checkFinished();

	//Reset time and update current animation index
	if(ended) {
		
		this.currAnimTime = 0;
		this.currAnimIndex++;
	}
	
	//Check if animations for this node are finished
	if(this.currAnimIndex >= this.animationRefs.length) this.finished = true;
}

/**
 * Reset animation matrix to identity matrix
 */
MyAnimationHandler.prototype.resetMatrix = function() {
    
    mat4.identity(this.transformMatrix);
}