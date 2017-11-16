/**
 * MyAnimation
 *
 * Utility function for handling vec3 and parsing an XML/LSX file
 */
class MyUtility {

	/**
	 * Performs a linear interpolation between two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {vec3} out
	 */
	static vec3_lerp(out, a, b, t) {

	  let ax = a[0];
	  let ay = a[1];
	  let az = a[2];
	  out[0] = ax + t * (b[0] - ax);
	  out[1] = ay + t * (b[1] - ay);
	  out[2] = az + t * (b[2] - az);
	  return out;

	}
	
	//Function from gl-matrix library, by Brandon Jones and Colin MacKenzie IV
	/**
	 * Get the angle between two 3D vectors
	 * @param {vec3} a The first operand
	 * @param {vec3} b The second operand
	 * @returns {Number} The angle in radians
	 */
	static vec3_angle(a, b) {
		
	  let tempA = vec3.fromValues(a[0], a[1], a[2]);
	  let tempB = vec3.fromValues(b[0], b[1], b[2]);

	  vec3.normalize(tempA, tempA);
	  vec3.normalize(tempB, tempB);

	  let cosine = vec3.dot(tempA, tempB);

	  if(cosine > 1.0) {
		return 0;
	  }
	  else if(cosine < -1.0) {
		return Math.PI;
	  } else {
		return Math.acos(cosine);
	  }
	}
}