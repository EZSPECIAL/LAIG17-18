/**
 * MyFrog, represents a frog on the board and keeps a reference to its nodeID and animationHandler
 * @constructor
**/
function MyFrog(nodeID) {
    
    // Frog color, node defined in LSX to serve as template
    this.nodeID = nodeID;
    
    // Stores all animations for this node and updates their state according to update time in scene
	this.animationHandler = null;
}