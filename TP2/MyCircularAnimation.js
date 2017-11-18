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

	let cosine = this.radius * Math.cos(totalAngle);
	let sine = this.radius * Math.sin(totalAngle);
	
	let matrix = mat4.create();
	mat4.translate(matrix, matrix, this.center);
	mat4.translate(matrix, matrix, vec3.fromValues(cosine, 0, -sine));

	//Calculate tangent vector
	let initOrient = vec3.fromValues(0, 0, 1) //ZZ+
	let radiusVector = vec3.fromValues(cosine, 0, -sine);

	let tangentOrient = vec3.create();
	vec3.cross(tangentOrient, radiusVector, vec3.fromValues(0, -1, 0)); //Get vector orthogonal to radius, which is the tangent
	vec3.normalize(tangentOrient, tangentOrient);
	
	let angle = MyUtility.vec3_angle(initOrient, tangentOrient);
	
	let axis = vec3.create();
	MyUtility.vec3_axis(axis, initOrient, tangentOrient);
	
	let orientMatrix = mat4.create();
	this.orientationMatrix = mat4.rotate(orientMatrix, orientMatrix, angle, axis);

	return matrix;
}