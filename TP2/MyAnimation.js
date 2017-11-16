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

MyAnimation.prototype.constructor = MyAnimation;

	/**
	 * Performs a linear interpolation between two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {vec3} out
	 */
MyAnimation.prototype.vec3_lerp = function(out, a, b, t) {

	  let ax = a[0];
	  let ay = a[1];
	  let az = a[2];
	  out[0] = ax + t * (b[0] - ax);
	  out[1] = ay + t * (b[1] - ay);
	  out[2] = az + t * (b[2] - az);
	  return out;

	}