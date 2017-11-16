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
 * 
 * Get Animation Matrix time seconds after animation's start
 *
 * @param time Time in seconds, after animation's start
 */
MyCircularAnimation.prototype.getAnimationMatrix = function(time){

	let totalAngle;
	let matrix = mat4.create();
	mat4.identity(matrix);

	let w = this.speed / this.radius;

	let incAngle = (w * time) * Math.PI / 180;

	if(incAngle < this.rotationAngle){
	
		totalAngle = this.initAngle + incAngle;

	} else{

		totalAngle = this.initAngle + this.rotationAngle;
	}

	let translateOriginVector = vec3.fromValues(-this.center[0], 0, -this.center[2]);
	mat4.translate(matrix, matrix, translateOriginVector);

	let rotateAxis = vec3.fromValues(0, 1, 0);
	mat4.rotate(matrix, matrix, totalAngle, rotateAxis);

	let reverseTranslate = vec3.fromValues(this.center[0], 0, this.center[2]);
	mat4.translate(matrix, matrix, reverseTranslate);

	return matrix;

}