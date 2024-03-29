/**
 * MyReverseBezierAnimation
 *
 * Copy of MyBezierAnimation with direction calculation reversed
 */
function MyReverseBezierAnimation(id, speed, controlPoints) {
	
	MyAnimation.call(this, id, speed);
	
	this.controlPoints = controlPoints;
	let totalLength = this.casteljauLength();
	this.totalTime = totalLength / (this.speed * 1000); // this.totalTime - Time of the entire animation
	this.coords = [];
	this.tangent = [];
};

MyReverseBezierAnimation.prototype = Object.create(MyAnimation.prototype);
MyReverseBezierAnimation.prototype.constructor = MyReverseBezierAnimation;

/**
 * Approximates bezier spline length by 1st iteration of the Casteljau algorithm
 */
MyReverseBezierAnimation.prototype.casteljauLength = function() {

	let points = [];
	let totalLength = 0;
	let differenceVector = vec3.create();
	let L2 = vec3.create();
	let H = vec3.create();
	let L3 = vec3.create();
	let R3 = vec3.create();
	let R2 = vec3.create();
	let divide2 = vec3.fromValues(2, 2, 2);

	vec3.add(L2, this.controlPoints[0], this.controlPoints[1]);
	vec3.divide(L2, L2, divide2);
	vec3.add(H, this.controlPoints[1], this.controlPoints[2]);
	vec3.divide(H, H, divide2);
	vec3.add(L3, L2, H);
	vec3.divide(L3, L3, divide2);
	vec3.add(R3, this.controlPoints[2], this.controlPoints[3]);
	vec3.divide(R3, R3, divide2);
	vec3.add(R2, H, R3);
	vec3.divide(R2, R2, divide2);

	points.push(this.controlPoints[0]);
	points.push(L2);
	points.push(L3);
	points.push(R2);
	points.push(R3);
	points.push(this.controlPoints[3]);

	for(let i = 0; i < points.length - 1; i++) {

		vec3.subtract(differenceVector, points[i], points[i + 1]);
		totalLength += vec3.length(differenceVector);
	}
	
	return totalLength;
}

/**
 * Calculates Bezier spline coords.
 *
 * @param      {number}  currT   Current time from 0 to 1.
 * @param      {number}  index   Index of coord to update.
 */
MyReverseBezierAnimation.prototype.calcBezier = function(currT, index) {

	this.coords[index] = Math.pow(1 - currT, 3) * this.controlPoints[0][index] +
	                     3 * currT * Math.pow(1 - currT, 2) * this.controlPoints[1][index] +
	                     3 * Math.pow(currT, 2) * (1 - currT) * this.controlPoints[2][index] +
	                     Math.pow(currT, 3) * this.controlPoints[3][index];
}

/**
 * Calculates Bezier spline tangent coords.
 *
 * @param      {number}  currT   Current time from 0 to 1.
 * @param      {number}  index   Index of coord to update.
 */
MyReverseBezierAnimation.prototype.calcBezierTangent = function(currT, index) {

	this.tangent[index] =  3 * Math.pow((1 - currT), 2) * (this.controlPoints[1][index] - this.controlPoints[0][index]) + 
						   6 * (1 - currT) * currT * (this.controlPoints[2][index] - this.controlPoints[1][index]) +
						   3 * Math.pow(currT, 2) * (this.controlPoints[3][index] - this.controlPoints[2][index]);
}

/**
 * Get transformation matrix of animation <time> milliseconds after animation's start.
 *
 * @param time Time in milliseconds, after animation's start
 */
MyReverseBezierAnimation.prototype.getAnimationMatrix = function(time) {

	//Use seconds for Bezier
	time = time / 1000;
	
	//Check if animation finished
	if(time > this.totalTime) {

		time = this.totalTime;
		this.finished = true;
	}
	
	let animTime = MyUtility.clamp(time / this.totalTime, 0, 1);
	
	//Calculate bezier coords and tangent coords
	this.calcBezier(animTime, 0);
	this.calcBezier(animTime, 1);
	this.calcBezier(animTime, 2);

	this.calcBezierTangent(animTime, 0);
	this.tangent[1] = 0;
	this.calcBezierTangent(animTime, 2);
	
    // Reverse the tangent
    let reverseVec = vec3.fromValues(-1, -1, -1);
    vec3.multiply(this.tangent, this.tangent, reverseVec);
    
	let matrix = mat4.create();
	mat4.translate(matrix, matrix, this.coords);

	//Transform matrix according to tangent vector and initial orientation
	let initOrient = vec3.fromValues(0, 0, 1) //ZZ+
	let angle = MyUtility.vec3_angle(initOrient, this.tangent);

	let axis = vec3.create();
	MyUtility.vec3_axis(axis, initOrient, this.tangent);

	if(this.tangent[0] == 0 && this.tangent[1] == 0 && this.tangent[2] == 0) return matrix;
	
	if(axis[0] == 0 && axis[1] == 0 && axis[2] == 0) {
		//If cross product is 0 any rotation axis orthogonal to initial orientation works, +YY is used
		mat4.rotateY(matrix, matrix, angle)
	} else {
		mat4.rotate(matrix, matrix, angle, axis);
	}
	
	return matrix;
}