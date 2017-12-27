/**
 * MyGameState class, handles game state and communication with the game server
 * @constructor
 */
function MyGameState(scene) {
    
    // Establish a reference to scene
    this.scene = scene;
    
    this.graph;
    
    // State / Event enumerators
    this.stateEnum = Object.freeze({INIT: 0, WAIT_BOARD: 1, WAIT_FIRST_PICK: 2, VALIDATE_FIRST_PICK: 3, WAIT_PICK_FROG: 4, WAIT_PICK_CELL: 5, VALIDATE_MOVE: 6, JUMP_ANIM: 7});
    this.eventEnum = Object.freeze({BOARD_REQUEST: 0, BOARD_LOAD: 1, FIRST_PICK: 2, NOT_VALID: 3, VALID: 4, PICK: 5, FINISHED_ANIM: 6});

    // Game state variables
    this.frogletBoard;
    this.frogs = []; // All the MyFrog objects on the board
    this.state = this.stateEnum.INIT;
    
    // Game flags
    this.boardLoaded = false;
    this.pickingFrogs = true; // Determines picking cells active
    
    // Selection variables
    this.pickedObject = 0; // Picked object ID
    this.selectedFrog = []; // Move source coords
    this.selectedCell = []; // Move destination coords
    
    // Server variables
    this.replyFlag = false; // Is a reply available?
    this.lastReply = []; // Last reply received from Prolog server

    this.isPlayer1 = true;
    
    // Player score variables
    this.player1Score = 0;
    this.player2Score = 0;
    this.player1Eaten = []; // List of node IDs of eaten frogs
    this.player2Eaten = []; // List of node IDs of eaten frogs
    
    // Game turn time
    this.turnTime = 60000;
    
    // Variables loaded from LSX
    this.boardSize = 0;

    //TODO remove?
    this.gameMessageCSS = "background: #222; color: #bada55";
}

/**
 * Initialize a scene graph
 */
MyGameState.prototype.initGraph = function(filename) {

    this.graph = new MySceneGraph(filename, this.scene);
}

/**
 * Update game state according to current events
 */
MyGameState.prototype.updateGameState = function(deltaT) {
    
    // Check if graph was changed on UI
    if(this.scene.lastGraph != this.scene.currentGraph) {
        
        this.scene.lastGraph = this.scene.currentGraph;
        this.scene.updatingGraph = true;
        return;
    }
    
    this.turnTime -= deltaT; //TODO move to appropriate state
    if(this.turnTime < 0) this.turnTime = 0;
    
    switch(this.state) {
        
        // Request initial board from server
        case this.stateEnum.INIT: {
            
            this.scene.makeRequest("genBoard");
            this.stateMachine(this.eventEnum.BOARD_REQUEST);
            
            break;
        }
        
        // Wait on board request and parse it when ready
        case this.stateEnum.WAIT_BOARD: {
            
            if(!this.isReplyAvailable()) return;

            this.frogletBoard = this.parseBoard(this.lastReply);
            this.createFrogs();
            
            this.boardLoaded = true;
            this.stateMachine(this.eventEnum.BOARD_LOAD);

            break;
        }
        
        // Wait on user to pick a green frog
        case this.stateEnum.WAIT_FIRST_PICK: {
            
            let pickID;
            if((pickID = this.isObjectPicked()) == 0) return;

            this.selectedFrog = this.indexToBoardCoords(pickID - 1);

            this.scene.makeRequest("selectCell(" + this.convertBoardToProlog() + ",first," + this.selectedFrog[1] + "," + this.selectedFrog[0] + ")");
            this.stateMachine(this.eventEnum.FIRST_PICK);
            
            break;
        }
        
        // Receive from server if picked cell was valid (green frog)
        case this.stateEnum.VALIDATE_FIRST_PICK: {
            
            if(!this.isReplyAvailable()) return;
            
            if(this.lastReply == 'false') {
                this.stateMachine(this.eventEnum.NOT_VALID);
            } else {
                
                this.removeFromBoard(this.selectedFrog);
                this.stateMachine(this.eventEnum.VALID);
            }

            break;
        }
        
        // Wait on user to pick a frog to jump
        case this.stateEnum.WAIT_PICK_FROG: {
            
            let pickID;
            if((pickID = this.isObjectPicked()) == 0) return;

            this.selectedFrog = this.indexToBoardCoords(pickID - 1);
            this.pickingFrogs = false;
            
            this.stateMachine(this.eventEnum.PICK);
            
            break;
        }
        
        // Wait on user to pick a cell to jump to
        case this.stateEnum.WAIT_PICK_CELL: {
            
            let pickID;
            if((pickID = this.isObjectPicked()) == 0) return;
            
            this.selectedCell = this.indexToBoardCoords(pickID - 1);
            this.pickingFrogs = true;
            this.scene.makeRequest("validMove(" + this.selectedCell[1] + "," + this.selectedCell[0] + "," + this.selectedFrog[1] + "," + this.selectedFrog[0] + "," + this.convertBoardToProlog() + ")");
            
            this.stateMachine(this.eventEnum.PICK);
            
            break;
        }
        
        // Receive from server if picked move is valid (is a jump)
        case this.stateEnum.VALIDATE_MOVE: {
            
            if(!this.isReplyAvailable()) return;
            
            if(this.lastReply == "0") {
                this.stateMachine(this.eventEnum.NOT_VALID);
            } else {
                
                // Update score according to player
                if(this.isPlayer1) this.player1Score += parseInt(this.lastReply);
                else this.player2Score += parseInt(this.lastReply);

                // Add frog to current player eaten frogs array
                this.eatFrog(this.lastReply);

                // TODO add comment
                this.frogJump(this.selectedFrog, this.selectedCell);

                // Toggle player and change state
                this.isPlayer1 = !this.isPlayer1;
                
                //TODO create jump anim
                this.frogs[this.selectedCell[0] + this.selectedCell[1] * 12].frogJumpAnim(this.selectedFrog, this.selectedCell, this.boardSize);
                this.stateMachine(this.eventEnum.VALID);
            }
            
            break;
        }
        
        // Play out jump animation
        case this.stateEnum.JUMP_ANIM: {

            if(this.frogs[this.selectedCell[0] + this.selectedCell[1] * 12].animationHandler.finished) {
                
                this.frogs[this.selectedCell[0] + this.selectedCell[1] * 12].animationHandler.resetMatrix();
                this.stateMachine(this.eventEnum.FINISHED_ANIM);
            }
            
            break;
        }
    }
}

/**
 * Game state machine, receives event and checks transitions available
 */
MyGameState.prototype.stateMachine = function(event) {
    
    switch(this.state) {
        
        case this.stateEnum.INIT: {
            
            if(event == this.eventEnum.BOARD_REQUEST) {
                console.log("%c Froglet board requested.", this.gameMessageCSS);
                this.state = this.stateEnum.WAIT_BOARD;
            }
            
            break;
        }
        
        case this.stateEnum.WAIT_BOARD: {
            
            if(event == this.eventEnum.BOARD_LOAD) {
                console.log("%c Froglet board loaded!", this.gameMessageCSS);
                this.state = this.stateEnum.WAIT_FIRST_PICK;
            }
            
            break;
        }
        
        case this.stateEnum.WAIT_FIRST_PICK: {
            
            if(event == this.eventEnum.FIRST_PICK) {
                this.state = this.stateEnum.VALIDATE_FIRST_PICK;
            }
            
            break;
        }
        
        case this.stateEnum.VALIDATE_FIRST_PICK: {
            
            if(event == this.eventEnum.NOT_VALID) {
                console.log("%c Not a green frog!", this.gameMessageCSS);
                this.state = this.stateEnum.WAIT_FIRST_PICK;
            } else if(event == this.eventEnum.VALID) {
                console.log("%c Green frog removed.", this.gameMessageCSS);
                this.state = this.stateEnum.WAIT_PICK_FROG;
            }
            
            break;
        }
        
        case this.stateEnum.WAIT_PICK_FROG: {
            
            if(event == this.eventEnum.PICK) {
                this.state = this.stateEnum.WAIT_PICK_CELL;
            }
            
            break;
        }
        
        case this.stateEnum.WAIT_PICK_CELL: {
            
            if(event == this.eventEnum.PICK) {
                this.state = this.stateEnum.VALIDATE_MOVE;
            }
            
            break;
        }
        
        case this.stateEnum.VALIDATE_MOVE: {
            
            if(event == this.eventEnum.NOT_VALID) {
                console.log("%c Not a valid jump!", this.gameMessageCSS);
                this.state = this.stateEnum.WAIT_PICK_FROG;
            } else if(event == this.eventEnum.VALID) {
                console.log("%c Jump!", this.gameMessageCSS);
                this.state = this.stateEnum.JUMP_ANIM;
            }
            
            break;
        }
        
        case this.stateEnum.JUMP_ANIM: {
            
            if(event == this.eventEnum.FINISHED_ANIM) {
                console.log("%c Finished jump animation.", this.gameMessageCSS);
                this.state = this.stateEnum.WAIT_PICK_FROG;
            }
            
            break;
        }
    }
}

/**
 * Returns frog nodeID according to board value
 */
MyGameState.prototype.getFrogColor = function(frog) {
    
    if(frog == "1") return "greenFrog";
    if(frog == "2") return "yellowFrog";
    if(frog == "3") return "redFrog";
    if(frog == "4") return "blueFrog";
    
    console.warn("Invalid frog!");
}

/**
 * Creates all the board frogs according to their color and position
 */
MyGameState.prototype.createFrogs = function() {

    for(let y = 0; y < 12; y++) {
        for(let x = 0; x < 12; x++) {

            this.frogs.push(new MyFrog(this.getFrogColor(this.frogletBoard[y][x]), [x, y], this.boardSize));
        }
    }
}

/**
 * Resizes all the board frogs according to current board size
 */
MyGameState.prototype.resizeFrogs = function() {

    for(let y = 0; y < 12; y++) {
        for(let x = 0; x < 12; x++) {

            this.frogs[x + y * 12].resizeFrog([x, y], this.boardSize);
        }
    }
}

/**
 * Checks if a object has been picked and resets it if it has
 *
 * @return 0 if no picked object, picked ID otherwise
 */
MyGameState.prototype.isObjectPicked = function() {
    
    if(this.pickedObject != 0) {
        
        let picked = this.pickedObject;
        this.pickedObject = 0;
        return picked;
    }
    
    return 0;
}

/**
 * Checks if Prolog server sent a reply and resets flag if it did
 *
 * @return boolean true if a reply happened
 */
MyGameState.prototype.isReplyAvailable = function() {
    
    if(this.replyFlag) {
        
        this.replyFlag = false;
        return true;
    }
    
    return false;
}

/**
 * Moves a frog to an empty cell clearing its node ID on the current position and setting it to the new position, also removing the frog in between coordinates
 */
MyGameState.prototype.frogJump = function(frogCoords, cellCoords) {
    
    let frogColor = this.frogletBoard[frogCoords[1]][frogCoords[0]];
    let midpoint = [(frogCoords[0] + cellCoords[0]) / 2, (frogCoords[1] + cellCoords[1]) / 2];
    
    this.frogletBoard[midpoint[1]][midpoint[0]] = "0";
    this.frogletBoard[frogCoords[1]][frogCoords[0]] = "0";
    this.frogletBoard[cellCoords[1]][cellCoords[0]] = frogColor;
    
    let frogColorNode = this.frogs[frogCoords[0] + frogCoords[1] * 12].nodeID;
    
    this.frogs[midpoint[0] + midpoint[1] * 12].nodeID = null;
    this.frogs[frogCoords[0] + frogCoords[1] * 12].nodeID = null;
    this.frogs[cellCoords[0] + cellCoords[1] * 12].nodeID = frogColorNode;
}

MyGameState.prototype.eatFrog = function(frog) {
    
    let frogID = this.getFrogColor(frog);
    
    if(this.isPlayer1) this.player1Eaten.push(frogID);
    else this.player2Eaten.push(frogID);
}

/**
 * Removes a frog from the board by clearing its node ID and setting it to "0" on the board
 */
MyGameState.prototype.removeFromBoard = function(coords) {
    
    this.frogletBoard[coords[1]][coords[0]] = "0";
    this.frogs[coords[0] + coords[1] * 12].nodeID = null;
}

/**
 * Parses Prolog board reply into 2D array
 */
MyGameState.prototype.parseBoard = function(boardString) {
    
    let frogletBoard = [];
    let boardLines = boardString.match(/\[(\d,)+\d\]/g);

    for(let i = 0; i < boardLines.length; i++) {
        
       let buildLine = [];
       buildLine = boardLines[i].match(/\d+/g);
       frogletBoard.push(buildLine);
    }

    return frogletBoard;
}

/**
 * Convert game board back to Prolog list representation
 */
MyGameState.prototype.convertBoardToProlog = function() {
    
    let prologBoard = "[";
    
    for(let y = 0; y < this.frogletBoard.length; y++) {
        
        prologBoard += "[";
        
        for(let x = 0; x < this.frogletBoard[y].length - 1; x++) {
            
            prologBoard += parseInt(this.frogletBoard[y][x]) + ",";
        }
        
        if(y == this.frogletBoard.length - 1) {
            prologBoard += parseInt(this.frogletBoard[y][this.frogletBoard[y].length - 1]) + "]";
        } else prologBoard += parseInt(this.frogletBoard[y][this.frogletBoard[y].length - 1]) + "],";
    }
    
    prologBoard += "]";
    
    return prologBoard;
}

/**
 * Gets board x/y coords from a 1D array index
 */
MyGameState.prototype.indexToBoardCoords = function(index) {
    
    let boardY = ~~(index / 12); //Integer division to find row
    let boardX = index - boardY * 12;
    
    return [boardX, boardY];
}