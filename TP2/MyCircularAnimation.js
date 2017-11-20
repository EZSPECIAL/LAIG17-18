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
	
	//Amount of total rotation to increment, range [0, 1]
	let totalFraction = incAngle / Math.abs(this.rotationAngle);
	
	if(incAngle < Math.abs(this.rotationAngle)) {
	
		totalAngle = this.initAngle + totalFraction * this.rotationAngle;
	} else {

		totalAngle = this.initAngle + this.rotationAngle;
		this.finished = true; //Rotation angle reached
	}

	//Calculate transformation matrix
	let cosine = this.radius * Math.cos(totalAngle);
	let sine = this.radius * Math.sin(totalAngle);
	
	let matrix = mat4.create();
	mat4.translate(matrix, matrix, this.center);
	mat4.translate(matrix, matrix, vec3.fromValues(cosine, 0, -sine));

	//Set tangent vector
	let tangentOrient;
	if(this.rotationAngle > 0) tangentOrient = vec3.fromValues(-sine, 0, -cosine);
	else tangentOrient = vec3.fromValues(sine, 0, cosine);
	
	//Calculate axis/angle
	let initOrient = vec3.fromValues(0, 0, 1) //ZZ+
	let angle = MyUtility.vec3_angle(initOrient, tangentOrient);
	
	let axis = vec3.create();
	MyUtility.vec3_axis(axis, initOrient, tangentOrient);
	
	//Calculate orientation matrix
	let orientMatrix = mat4.create();
	if(axis[0] == 0 && axis[1] == 0 && axis[2] == 0) this.orientationMatrix = mat4.rotateY(orientMatrix, orientMatrix, angle);
	else this.orientationMatrix = mat4.rotate(orientMatrix, orientMatrix, angle, axis);

	return matrix;
}