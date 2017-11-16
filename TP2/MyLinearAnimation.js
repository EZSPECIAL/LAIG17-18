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

MyLinearAnimation.prototype.getDistances = function() {
	
	let lineVector;

	for(let i = 0; i < this.controlPoints.length - 1; i++) {

		this.distances.push(vec3.distance(this.controlPoints[i], this.controlPoints[i + 1]));
		this.totalDistance += this.distances[i];
	}
}


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

	if(this.distances.length == index) {

	} else {

		let lerpAmount = currPosition / this.distances[index];
		this.vec3_lerp(translateVector, this.controlPoints[index], this.controlPoints[index + 1], lerpAmount);

	}
	console.log(translateVector);
	let matrix = mat4.create();
	mat4.identity(matrix);
	mat4.translate(matrix, matrix, translateVector);

	return matrix;
}