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
	this.speed = speed;
};