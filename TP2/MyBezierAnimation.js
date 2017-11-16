/**
 * MyBezierAnimation
 *
 * Class for animations following a bezier spline with specified control points and speed
 */
function MyBezierAnimation(id, speed, controlPoints) {
	
	MyAnimation.call(this, id, speed);
	
	this.controlPoints = controlPoints;
};

MyBezierAnimation.prototype = Object.create(MyAnimation.prototype);
MyBezierAnimation.prototype.constructor = MyBezierAnimation;