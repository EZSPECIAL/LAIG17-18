/**
 * MyFrog, represents a frog on the board and keeps a reference to its nodeID and animationHandler
 * @constructor
**/
function MyFrog(nodeID, coords, boardSize) {
    
    let cellSize = boardSize / 12;
    let cellCenter = cellSize / 2.0;
    
    // Frog position, allows easy manipulation of frogs on board
    this.transformMatrix = mat4.create();
    mat4.translate(this.transformMatrix, this.transformMatrix, vec3.fromValues(coords[0] * cellSize + cellCenter, 0.05, coords[1] * cellSize + cellCenter));
    
    // Frog color, node defined in LSX to serve as template
    this.nodeID = nodeID;
    
    // Stores all animations for this node and updates their state according to update time in scene
	this.animationHandler = new MyAnimationHandler([], true);
}

/**
 * Resize frog according to board size
 */
MyFrog.prototype.resizeFrog = function(coords, boardSize) {
    
    let cellSize = boardSize / 12;
    let cellCenter = cellSize / 2.0;
    
    this.transformMatrix = mat4.create();
    mat4.translate(this.transformMatrix, this.transformMatrix, vec3.fromValues(coords[0] * cellSize + cellCenter, 0.05, coords[1] * cellSize + cellCenter));
}