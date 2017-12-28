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
MyFrog.prototype.frogHopAnim = function(animSpeed) {
    
    let control = [];
    control.push(vec3.fromValues(0, 0, 0));
    control.push(vec3.fromValues(0, 3, 0));
    control.push(vec3.fromValues(0, 0, 0));
    
    this.animationHandler = new MyAnimationHandler([new MyLinearAnimation("MyLinearHop", animSpeed, control)], false);
}

/**
 * Frog jump animation
 */
MyFrog.prototype.frogJumpAnim = function(srcCoords, destCoords, boardSize, animSpeed) {

    let cellSize = boardSize / 12;
    let cellCenter = cellSize / 2.0;

    let srcX = srcCoords[0] * cellSize + cellCenter;
    let srcZ = srcCoords[1] * cellSize + cellCenter;
    let destX = destCoords[0] * cellSize + cellCenter;
    let destZ = destCoords[1] * cellSize + cellCenter;
    let distX = destX - srcX;
    let distZ = destZ - srcZ;

    let bezierControl = [];
    bezierControl.push(vec3.fromValues(0 - distX, 0, 0 - distZ));
    bezierControl.push(vec3.fromValues(0 - distX, 3, 0 - distZ));
    bezierControl.push(vec3.fromValues(0, 3, 0));
    bezierControl.push(vec3.fromValues(0, 0, 0));

    this.animationHandler = new MyAnimationHandler([new MyBezierAnimation("MyBezierJump", animSpeed, bezierControl)], false);
}