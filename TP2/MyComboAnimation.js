/**
 * MyComboAnimation
 *
 * Class for combo animations which allows animations to be chained together
 */
function MyComboAnimation(id, spanRefs) {
	
	MyAnimation.call(this, id, 0);
	
	this.spanRefs = spanRefs;
};

MyComboAnimation.prototype = Object.create(MyAnimation.prototype);
MyComboAnimation.prototype.constructor = MyComboAnimation;