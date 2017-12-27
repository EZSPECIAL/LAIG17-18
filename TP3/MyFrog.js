/**
 * MyFrog, represents a frog on the board and keeps a reference to its nodeID and animationHandler
 * @constructor
**/
function MyFrog(nodeID, coords, boardSize) {
    
    let cellSize = boardSize / 12;
    let cellCenter = cellSize / 2.0;
    let yAdjust = 0.25 * boardSize / 120 + 0.05; // 0.2 Y adjust works for 120 board size, calculate needed adjust for current board size
    
    // Frog position, allows easy manipulation of frogs on board
    this.transformMatrix = mat4.create();
    mat4.translate(this.transformMatrix, this.transformMatrix, vec3.fromValues(coords[0] * cellSize + cellCenter, yAdjust, coords[1] * cellSize + cellCenter));
    
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
    let yAdjust = 0.25 * boardSize / 120 + 0.05; // 0.2 Y adjust works for 120 board size, calculate needed adjust for current board size
    
    this.transformMatrix = mat4.create();
    mat4.translate(this.transformMatrix, this.transformMatrix, vec3.fromValues(coords[0] * cellSize + cellCenter, yAdjust, coords[1] * cellSize + cellCenter));
}

/**
 * Frog hop in place animation
 */
MyFrog.prototype.frogHopAnim = function(boardSize) {
    
    let cellSize = boardSize / 12;
    let cellCenter = cellSize / 2.0;
    
    let control = [];
    control.push([0, 0, 0]);
    control.push([0, 5, 0]);
    
    this.animationHandler = new MyAnimationHandler([new MyLinearAnimation("MyHop", 5, control)], false);
}

/**
 * Frog jump animation
 */
MyFrog.prototype.frogJumpAnim = function(srcCoords, destCoords, boardSize) {
    
    let cellSize = boardSize / 12;
    let cellCenter = cellSize / 2.0;
    
    let control = [];
    control.push([0, 0, 0]); //TODO 4 control points based on src cell -> dest cell
    control.push([0, 5, 0]);
    
    //TODO bezier
    this.animationHandler = new MyAnimationHandler([new MyLinearAnimation("MyHop", 5, control)], false);   
}