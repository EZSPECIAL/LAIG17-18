/**
 * MyGameState class, handles game state and communication with the game server
 * @constructor
 */
function MyGameState(scene) {
    
    // Establish a reference to scene
    this.scene = scene;
    
    this.graph;
    
    // State / Event enumerators
    this.stateEnum = Object.freeze({INIT: 0, WAIT_BOARD: 1, WAIT_FIRST_PICK: 2, VALIDATE_FIRST_PICK: 3, WAIT_PICK_FROG: 4, WAIT_PICK_CELL: 5, VALIDATE_MOVE: 6, JUMP_ANIM: 7, CAMERA_ANIM: 8});
    this.eventEnum = Object.freeze({BOARD_REQUEST: 0, BOARD_LOAD: 1, FIRST_PICK: 2, NOT_VALID: 3, VALID: 4, PICK: 5, FINISHED_ANIM: 6, TURN_TIME: 7, UNDO: 8});
    this.animationStates = Object.freeze([this.stateEnum.JUMP_ANIM, this.stateEnum.CAMERA_ANIM]);
    this.validationStates = Object.freeze([this.stateEnum.VALIDATE_FIRST_PICK, this.stateEnum.VALIDATE_MOVE]);
    this.undoStates = Object.freeze([this.stateEnum.WAIT_PICK_FROG, this.stateEnum.WAIT_PICK_CELL]);

    // Game state variables
    this.frogletBoard = [];
    this.undoBoards = [];
    this.frogs = []; // All the MyFrog objects on the board
    this.state = this.stateEnum.INIT;
    
    // Logic / UI flags
    this.boardLoaded = false;
    this.pickingFrogs = true; // Determines picking cells active
    this.isPlayer1 = true;
    this.animateCamera = true;
    this.buttonTimer = 0; // Time (ms) left for highlighting button
    this.buttonTimeLimit = Object.freeze(500);
    this.validMove = true; // Only used for player feedback
    this.validTimer = 0; // Time (ms) to flash wrong frog
    this.validTimeLimit = Object.freeze(500);
    
    // Selection variables
    this.pickedObject = 0; // Picked object ID
    this.selectedFrog = []; // Move source coords
    this.selectedCell = []; // Move destination coords
    this.buttonPressed = "none"; // Which picking UI button is pressed
    
    // Server variables
    this.replyFlag = false; // Is a reply available?
    this.lastReply = []; // Last reply received from Prolog server
    
    // Player score variables
    this.player1Score = 0;
    this.player2Score = 0;
    this.player1Eaten = []; // List of node IDs of eaten frogs
    this.player2Eaten = []; // List of node IDs of eaten frogs
    
    // Game turn variables
    this.turnTime = 0;
    this.turnTimeLimit = 0;
    this.turnActive = false;
    
    // UI Pick IDs
    this.playGamePickID = Object.freeze(145);
    this.undoPickID = Object.freeze(146);
    this.jumpYesPickID = Object.freeze(147);
    this.jumpNoPickID = Object.freeze(148);
    
    // Undo array indexes
    this.undoFrogI = Object.freeze(0);
    this.undoCellI = Object.freeze(1);
    this.undoOriginNodeI = Object.freeze(2);
    this.undoMidNodeI = Object.freeze(3);
    this.undoCurrPlayerI = Object.freeze(4);
    this.undoPointsI = Object.freeze(5);
    
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
    
    //TODO move to function
    // Check if graph was changed on UI
    if(this.scene.lastGraph != this.scene.currentGraph) {

        // Check if current state is an animation state and prevent changing graph until animation finishes
        if(!this.animationStates.includes(this.state)) {

            this.scene.lastGraph = this.scene.currentGraph;
            this.scene.updatingGraph = true;
            return;
        }
    }
    
    // Check if undo was pressed on a valid state
    this.undoCheck();
    
    // Update timers
    this.buttonTimer = this.updateTimer(deltaT, this.buttonTimer);
    this.validTimer = this.updateTimer(deltaT, this.validTimer);
    
    // Update turn time and current player turn
    this.updateTurn(deltaT);
    
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
            if((pickID = this.isBoardPicked()) == 0) return;

            this.selectedFrog = this.indexToBoardCoords(pickID - 1);

            this.scene.makeRequest("selectCell(" + this.convertBoardToProlog() + ",first," + this.selectedFrog[1] + "," + this.selectedFrog[0] + ")");
            this.stateMachine(this.eventEnum.FIRST_PICK);
            
            break;
        }
        
        // Receive from server if picked cell was valid (green frog)
        case this.stateEnum.VALIDATE_FIRST_PICK: {
            
            if(!this.isReplyAvailable()) return;
            
            if(this.lastReply == 'false') {
                
                this.validMove = false;
                this.validTimer = this.validTimeLimit; // Start timer for shader
                this.stateMachine(this.eventEnum.NOT_VALID);
            } else {
             
                this.turnTimeLimit = this.scene.turnTimeLimit * 1000; //TODO init this on new game
             
                this.validMove = true;
                this.removeFromBoard(this.selectedFrog);
                this.selectedFrog = [];
                
                this.stateMachine(this.eventEnum.VALID);
            }

            break;
        }
        
        // Wait on user to pick a frog to jump
        case this.stateEnum.WAIT_PICK_FROG: {
            
            if(!this.turnActive) {
                
                // Activate turn time since next state will be the game loop
                this.turnTime = this.turnTimeLimit;
                this.turnActive = true;
            }
            
            let pickID;
            if((pickID = this.isBoardPicked()) == 0) return;

            this.selectedFrog = this.indexToBoardCoords(pickID - 1);
            this.pickingFrogs = false;
            
            // Frog hop animation
            if(this.scene.frogAnim) this.frogs[this.selectedFrog[0] + this.selectedFrog[1] * 12].frogHopAnim(this.scene.frogAnimSpeed);

            this.stateMachine(this.eventEnum.PICK);
            
            break;
        }
        
        // Wait on user to pick a cell to jump to
        case this.stateEnum.WAIT_PICK_CELL: {
            
            // Restart frog hop animation if needed
            if(this.scene.frogAnim) {
                let frog = this.frogs[this.selectedFrog[0] + this.selectedFrog[1] * 12];
                if(frog.animationHandler.finished) frog.frogHopAnim(this.scene.frogAnimSpeed);
            }
            
            let pickID;
            if((pickID = this.isBoardPicked()) == 0) return;

            this.selectedCell = this.indexToBoardCoords(pickID - 1);

            // Update frog selection in case player changes their mind
            if(this.frogletBoard[this.selectedCell[1]][this.selectedCell[0]] != "0") {
                
                this.selectedFrog = this.selectedCell;
                break;
            }
            
            this.pickingFrogs = true;
  
            this.scene.makeRequest("validMove(" + this.selectedCell[1] + "," + this.selectedCell[0] + "," + this.selectedFrog[1] + "," + this.selectedFrog[0] + "," + this.convertBoardToProlog() + ")");
            
            this.stateMachine(this.eventEnum.PICK);
            
            break;
        }
        
        // Receive from server if picked move is valid (is a jump)
        case this.stateEnum.VALIDATE_MOVE: {
            
            if(!this.isReplyAvailable()) return;
            
            if(this.lastReply == "0") {
                
                // Reset player selection
                this.pickingFrogs = false;
                this.selectedCell = [];
                this.stateMachine(this.eventEnum.NOT_VALID);
            } else {
                
                this.turnActive = false;
                
                // Update score according to player
                if(this.isPlayer1) this.player1Score += parseInt(this.lastReply);
                else this.player2Score += parseInt(this.lastReply);

                // Add frog to current player eaten frogs array
                this.eatFrog(this.lastReply);

                // Edit board and display frogs for jump effect, also stores move for undoing
                this.frogJump(this.selectedFrog, this.selectedCell);

                // Toggle player and change state
                this.isPlayer1 = !this.isPlayer1;
                
                // Frog jump animation
                if(this.scene.frogAnim) this.frogs[this.selectedCell[0] + this.selectedCell[1] * 12].frogJumpAnim(this.selectedFrog, this.selectedCell, this.scene.frogAnimSpeed);
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
        
        // Play out camera animation
        case this.stateEnum.CAMERA_ANIM: {
            
            if(!this.animateCamera) this.stateMachine(this.eventEnum.FINISHED_ANIM);
            else if(this.scene.updatePlayerCameraPos(this.isPlayer1)) {

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
            } else if(event == this.eventEnum.TURN_TIME) {
                this.cameraAnimCheck(); // Handle camera animation
                this.state = this.stateEnum.CAMERA_ANIM;
            } else if(event == this.eventEnum.UNDO) {
                this.cameraAnimCheck(); // Handle camera animation
                this.state = this.stateEnum.CAMERA_ANIM;
            }
            
            break;
        }
        
        case this.stateEnum.WAIT_PICK_CELL: {
            
            if(event == this.eventEnum.PICK) {
                this.state = this.stateEnum.VALIDATE_MOVE;
            } else if(event == this.eventEnum.TURN_TIME) {
                this.cameraAnimCheck(); // Handle camera animation
                this.state = this.stateEnum.CAMERA_ANIM;
            } else if(event == this.eventEnum.UNDO) {
                this.cameraAnimCheck(); // Handle camera animation
                this.state = this.stateEnum.CAMERA_ANIM;
            }
            
            break;
        }
        
        case this.stateEnum.VALIDATE_MOVE: {
            
            if(event == this.eventEnum.NOT_VALID) {
                console.log("%c Not a valid jump!", this.gameMessageCSS);
                this.state = this.stateEnum.WAIT_PICK_CELL;
            } else if(event == this.eventEnum.VALID) {
                console.log("%c Jump!", this.gameMessageCSS);
                this.state = this.stateEnum.JUMP_ANIM;
            }
            
            break;
        }
        
        case this.stateEnum.JUMP_ANIM: {
            
            if(event == this.eventEnum.FINISHED_ANIM) {
                console.log("%c Finished jump animation.", this.gameMessageCSS);
                this.cameraAnimCheck(); // Handle camera animation
                this.state = this.stateEnum.CAMERA_ANIM;
            }
            
            break;
        }
        
        case this.stateEnum.CAMERA_ANIM: {
            
            if(event == this.eventEnum.FINISHED_ANIM) {
                this.state = this.stateEnum.WAIT_PICK_FROG;
            }
            
            break;
        }
    }
    
    this.pickedObject = 0; // Dismiss selection during state change
}

/**
 * Receives a timer and returns the updated value
 */
MyGameState.prototype.updateTimer = function(deltaT, timer) {
    
    timer -= deltaT;
    if(timer < 0) timer = 0;
    
    return timer;
}

/**
 * Checks GUI value to see if camera should animate and fixes the position if needed
 */
MyGameState.prototype.buttonPress = function(buttonString) {

    this.buttonPressed = buttonString;
    this.buttonTimer = this.buttonTimeLimit;
}

/**
 * Checks GUI value to see if camera should animate and fixes the position if needed
 */
MyGameState.prototype.cameraAnimCheck = function(deltaT) {
    
    this.animateCamera = this.scene.animCamera;
    if(!this.animateCamera) this.scene.setPlayerCameraPos(this.isPlayer1);
}

/**
 * Check if undo button was clicked and if so undoes last play, undo format is [frogCoords, cellCoords, originNodeID, midpointNodeID, currentPlayer, points]
 */
MyGameState.prototype.undoCheck = function() {
    
    // Was undo button pressed
    if(this.pickedObject != this.undoPickID) return;
    
    this.buttonPress("undoFail");
    
    // Check if state is valid for undoing
    if(!this.undoStates.includes(this.state)) return;

    // Is there a move to undo
    if(this.undoBoards.length <= 0) return;
    
    this.buttonPress("undoDone");
    
    let undoBoard = this.undoBoards[this.undoBoards.length - 1];
    
    this.reverseJump(undoBoard, undoBoard[this.undoFrogI], undoBoard[this.undoCellI]);
    
    // Undo points and revert eaten frog array
    if(undoBoard[this.undoCurrPlayerI]) {
        
        this.player1Eaten.pop();
        this.player1Score -= undoBoard[this.undoPointsI];
    }
    else {
        this.player2Eaten.pop();
        this.player2Score -= undoBoard[this.undoPointsI];
    }

    this.undoBoards.pop();

    // Reset turn and swap to old player
    this.isPlayer1 = undoBoard[this.undoCurrPlayerI];
    this.resetTurn();
    
    this.stateMachine(this.eventEnum.UNDO);
}

/**
 * Reset important turn variables
 */
MyGameState.prototype.resetTurn = function() {
    
    this.selectedCell = [];
    this.selectedFrog = [];
    
    this.pickedObject = 0;
    this.pickingFrogs = true;
    this.turnActive = false;
}

/**
 * Reverses a jump
 */
MyGameState.prototype.reverseJump = function(undoBoard, frogCoords, cellCoords) {
    
    let midpoint = [(frogCoords[0] + cellCoords[0]) / 2, (frogCoords[1] + cellCoords[1]) / 2];
    
    // Undo board jump
    this.frogletBoard[frogCoords[1]][frogCoords[0]] = this.getFrogValue(undoBoard[this.undoOriginNodeI]);
    this.frogletBoard[midpoint[1]][midpoint[0]] = this.getFrogValue(undoBoard[this.undoMidNodeI]);
    this.frogletBoard[cellCoords[1]][cellCoords[0]] = "0";

    // Undo frog display manipulation
    this.frogs[frogCoords[0] + frogCoords[1] * 12].nodeID = undoBoard[this.undoOriginNodeI];
    this.frogs[midpoint[0] + midpoint[1] * 12].nodeID = undoBoard[this.undoMidNodeI];
    this.frogs[cellCoords[0] + cellCoords[1] * 12].nodeID = null;
}

/**
 * Updates turn time and changes turn if player lost turn
 */
MyGameState.prototype.updateTurn = function(deltaT) {
    
    // Update turn time remaining
    if(this.turnActive) {
        this.turnTime -= deltaT;
        if(this.turnTime < 0) {
            
            this.turnTime = 0;
           
            // Reset turn only if current state is not waiting for server validation
            if(!this.validationStates.includes(this.state)) {
                
                // Resets turn and swap current player
                this.isPlayer1 = !this.isPlayer1;
                
                this.resetTurn();
               
                this.stateMachine(this.eventEnum.TURN_TIME);
            
            }
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
 * Returns frog board value according to frog nodeID
 */
MyGameState.prototype.getFrogValue = function(frog) {
    
    if(frog == "greenFrog") return "1";
    if(frog == "yellowFrog") return "2";
    if(frog == "redFrog") return "3";
    if(frog == "blueFrog") return "4";
    
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
 * Checks if a board element has been picked and resets picked ID
 *
 * @return 0 if no picked object, picked ID otherwise
 */
MyGameState.prototype.isBoardPicked = function() {
    
    if(this.pickedObject > 0 && this.pickedObject <= 144) {
        
        let picked = this.pickedObject;
        this.pickedObject = 0;
        return picked;
    }
    
    this.pickedObject = 0;
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
 * Moves a frog to an empty cell clearing its node ID on the current position and setting it to the new position,
 * also removing the frog in between coordinates. Stores the movement details to an array for undoing moves
 */
MyGameState.prototype.frogJump = function(frogCoords, cellCoords) {
    
    let frogColor = this.frogletBoard[frogCoords[1]][frogCoords[0]];
    let midpoint = [(frogCoords[0] + cellCoords[0]) / 2, (frogCoords[1] + cellCoords[1]) / 2];
    
    let myUndo = [];

    // Store old board and coordinates of move
    myUndo.push(frogCoords, cellCoords);
    
    // Manipulate board values
    this.frogletBoard[midpoint[1]][midpoint[0]] = "0";
    this.frogletBoard[frogCoords[1]][frogCoords[0]] = "0";
    this.frogletBoard[cellCoords[1]][cellCoords[0]] = frogColor;
    
    let frogColorNode = this.frogs[frogCoords[0] + frogCoords[1] * 12].nodeID;
    
    // Store origin frog and in-between frog nodeID
    myUndo.push(frogColorNode);
    myUndo.push(this.frogs[midpoint[0] + midpoint[1] * 12].nodeID);

    // Manipulate MyFrog objects
    this.frogs[midpoint[0] + midpoint[1] * 12].nodeID = null;
    this.frogs[frogCoords[0] + frogCoords[1] * 12].nodeID = null;
    this.frogs[cellCoords[0] + cellCoords[1] * 12].nodeID = frogColorNode;
    
    // Store old player and move score
    myUndo.push(this.isPlayer1);
    myUndo.push(parseInt(this.lastReply));
    
    this.undoBoards.push(myUndo);
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