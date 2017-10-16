/**
 * MyNURBS
 *
 * Constructs a NURBS with parameters loaded from a XML scene file, using WebCGF built-in functions.
 */
 function MyNURBS(scene, degreeU, degreeV, uDivs, vDivs, parameters) {
	 
	CGFobject.call(this, scene);
	
	var uKnots = this.getKnotsVector(degreeU);
	var vKnots = this.getKnotsVector(degreeV);
	
	var nurbsSurface = new CGFnurbsSurface(degreeU, degreeV, uKnots, vKnots, parameters);
	
	getSurfacePoint = function(u, v) {
		return nurbsSurface.getPoint(u, v);
	};

	this.NURBS = new CGFnurbsObject(scene, getSurfacePoint, uDivs, vDivs);
}

MyNURBS.prototype = Object.create(CGFobject.prototype);
MyNURBS.prototype.constructor = MyNURBS;

MyNURBS.prototype.display = function() {
	
	this.NURBS.display();
}

MyNURBS.prototype.getKnotsVector = function(degree) {
	
	var v = new Array();
	
	for (var i = 0; i <= degree; i++) {
		v.push(0);
	}
	
	for (var i = 0; i <= degree; i++) {
		v.push(1);
	}
	
	return v;
};