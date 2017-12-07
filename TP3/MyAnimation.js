/**
 * MyAnimation
 *
 * Abstract class for animation objects.
 */
function MyAnimation(id, speed) {
	
	if(this.constructor === MyAnimation) {
		throw new Error("Can't instantiate MyAnimation abstract class!");
	}
	
	this.id = id;
	this.speed = speed / 1000; //Convert to milliseconds
	this.finished = false;
};

/**
 * Check if animation has ended and reset boolean if it has.
 */
MyAnimation.prototype.checkFinished = function() {
	
	if(this.finished) {
		this.finished = false;
		return true;
	} else return false;
}