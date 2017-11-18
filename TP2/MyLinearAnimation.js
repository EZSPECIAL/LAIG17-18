/**
 * MyLinearAnimation
 *
 * Class for linear animations which allow an object to move in a straight line from control point to control point at the specified speed
 */
function MyLinearAnimation(id, speed, controlPoints) {
	
	MyAnimation.call(this, id, speed);
	
	this.controlPoints = controlPoints;
	this.distances = [];
	this.totalDistance = 0;
	
	this.getDistances();
};

MyLinearAnimation.prototype = Object.create(MyAnimation.prototype);
MyLinearAnimation.prototype.constructor = MyLinearAnimation;

/**
 * Calculate line segment distances between all control points
 */
MyLinearAnimation.prototype.getDistances = function() {
	
	for(let i = 0; i < this.controlPoints.length - 1; i++) {

		this.distances.push(vec3.distance(this.controlPoints[i], this.controlPoints[i + 1]));
		this.totalDistance += this.distances[i];
	}
}

/**
 * Get transformation matrix of animation <time> milliseconds after animation's start
 *
 * @param time Time in milliseconds, after animation's start
 */
MyLinearAnimation.prototype.getAnimationMatrix = function(time) {
	
	let currPosition = this.speed * time;
	let accumulatedDist = 0; 
	let index;
	let translateVector = vec3.create();

	for(index = 0; index < this.distances.length; index++) {

		accumulatedDist += this.distances[index];

		if(accumulatedDist >= currPosition) {

			currPosition -= accumulatedDist - this.distances[index];
			break;
		}
	}

	let tangentStart;
	let tangentEnd;
	
	if(currPosition >= accumulatedDist) {
		
		tangentStart = vec3.clone(this.controlPoints[this.controlPoints.length - 2]);
		tangentEnd = vec3.clone(this.controlPoints[this.controlPoints.length - 1]);
		translateVector = this.controlPoints[this.controlPoints.length - 1];
		
		this.finished = true; //Reached last control point
	} else {
		
		let lerpAmount = currPosition / this.distances[index];
		
		tangentStart = vec3.clone(this.controlPoints[index]);
		tangentEnd = vec3.clone(this.controlPoints[index + 1]);
		MyUtility.vec3_lerp(translateVector, this.controlPoints[index], this.controlPoints[index + 1], lerpAmount);
	}

	tangentStart[1] = 0;
	tangentEnd[1] = 0;

	let initOrient = vec3.fromValues(0, 0, 1) //ZZ+
	let tangentOrient = vec3.create();
	vec3.subtract(tangentOrient, tangentEnd, tangentStart);
	
	let angle = MyUtility.vec3_angle(initOrient, tangentOrient);
	
	let axis = vec3.create();
	MyUtility.vec3_axis(axis, initOrient, tangentOrient);
	
	let matrix = mat4.create();
	mat4.translate(matrix, matrix, translateVector);
	
	if(tangentOrient[0] == 0 && tangentOrient[1] == 0 && tangentOrient[2] == 0) return matrix;
	
	let orientMatrix = mat4.create();
	if(axis[0] == 0 && axis[1] == 0 && axis[2] == 0) {
		//If cross product is 0 any rotation axis orthogonal to initial orientation works, +YY is used
		this.orientationMatrix = mat4.rotate(orientMatrix, orientMatrix, angle, [0, 1, 0])
	} else {
		this.orientationMatrix = mat4.rotate(orientMatrix, orientMatrix, angle, axis);
	}
	
	return matrix;
}