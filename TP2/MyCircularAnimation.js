/**
 * MyCircularAnimation
 *
 * Class for circular animations which allow an object to rotate around a specified center with a certain radius and rotation angle
 */
function MyCircularAnimation(id, speed, center, radius, initAngle, rotationAngle) {
	
	MyAnimation.call(this, id, speed);
	
	this.center = center;
	this.radius = radius;
	this.initAngle = initAngle * Math.PI / 180;
	this.rotationAngle = rotationAngle * Math.PI / 180;
};

MyCircularAnimation.prototype = Object.create(MyAnimation.prototype);
MyCircularAnimation.prototype.constructor = MyCircularAnimation;

/**
 * Get transformation matrix of animation <time> milliseconds after animation's start
 *
 * @param time Time in milliseconds, after animation's start
 */
MyCircularAnimation.prototype.getAnimationMatrix = function(time) {

	let totalAngle = 0;
	
	let w = this.speed / this.radius;
	let incAngle = w * time;
	
	if(incAngle < this.rotationAngle) {
	
		totalAngle = this.initAngle + incAngle;
	} else {

		totalAngle = this.initAngle + this.rotationAngle;
		this.finished = true; //Rotation angle reached
	}

	let matrix = mat4.create();
	mat4.translate(matrix, matrix, this.center);
	mat4.translate(matrix, matrix, vec3.fromValues(this.radius * Math.cos(totalAngle), 0, -this.radius * Math.sin(totalAngle)));

	return matrix;
}