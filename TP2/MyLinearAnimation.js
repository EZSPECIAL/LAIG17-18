/**
 * MyLinearAnimation
 *
 * Class for linear animations which allow an object to move in a straight line from control point to control point at the specified speed
 */
function MyLinearAnimation(id, speed, controlPoints) {
	
	MyAnimation.call(this, id, speed);
	
	this.controlPoints = controlPoints;
};

MyLinearAnimation.prototype = Object.create(MyAnimation.prototype);
MyLinearAnimation.prototype.constructor = MyLinearAnimation;