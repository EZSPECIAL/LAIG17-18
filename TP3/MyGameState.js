/**
 * MyGameState class, handles game state and communication with the game server
 * @constructor
 */
function MyGameState(scene) {
    
    this.scene = scene;
    
    // State / Event enumerators
    this.stateEnum = Object.freeze({INIT: 0, WAIT_BOARD: 1, WAIT_FIRST_PICK: 2, VALIDATE_FIRST_PICK: 3, WAIT_PICK_FROG: 4, WAIT_PICK_CELL: 5, VALIDATE_MOVE: 6});
    this.eventEnum = Object.freeze({BOARD_REQUEST: 0, BOARD_LOAD: 1, FIRST_PICK: 2, NOT_VALID: 3, VALID: 4, PICK: 5});

    // Dynamic game vars
    this.frogletBoard;
    this.frogs = []; // All the MyFrog objects on the board
    this.state = this.stateEnum.INIT;
    
    this.boardLoaded = false;
    
    this.pickedObject = 0; // Picked object ID

    this.replyFlag = false; // Is a reply available?
    this.lastReply = []; // Last reply received from Prolog server
    
    this.selectedFrog = []; // Move source coords
    this.selectedCell = []; // Move destination coords
    
    this.player1Score = 0;
    this.player2Score = 0;
    this.player1Eaten = []; // List of node IDs of eaten frogs
    this.player2Eaten = []; // List of node IDs of eaten frogs
    
    this.pickingFrogs = true; // Determines picking cells active
    
    // Static game vars loaded from LSX
    this.boardSize = 0;

    //TODO remove?
    this.gameMessageCSS = "background: #222; color: #bada55";
}

/**
 * Update game state according to current events
 */
MyGameState.prototype.updateGameState = function() {
    
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
                
                this.player1Score += parseInt(this.lastReply); //TODO update according to player
                this.player2Score += parseInt(this.lastReply);

                this.eatFrog(this.lastReply); //TODO consider player
                
                this.frogJump(this.selectedFrog, this.selectedCell); //TODO "eaten" frog is known at this point, lastReply has the points which = frog color
                this.stateMachine(this.eventEnum.VALID);
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
                this.state = this.stateEnum.WAIT_PICK_FROG;
            }
            
            break;
        }
    }
}

/**
 * Creates all the board frogs according to their color and position
 */
MyGameState.prototype.createFrogs = function() {

    for(let y = 0; y < 12; y++) {
        for(let x = 0; x < 12; x++) {

            switch(this.frogletBoard[y][x]) {
                
                case "1": {
                    
                    this.frogs.push(new MyFrog("greenFrog", [x, y], this.boardSize));
                    break;
                }
                
                case "2": {
                    
                    this.frogs.push(new MyFrog("yellowFrog", [x, y], this.boardSize));
                    break;
                }
                
                case "3": {
                    
                    this.frogs.push(new MyFrog("redFrog", [x, y], this.boardSize));
                    break;
                }
                
                case "4": {
                    
                    this.frogs.push(new MyFrog("blueFrog", [x, y], this.boardSize));
                    break;
                }
            }
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
    
    //TODO consider current player and refactor switch statement
    switch(frog) {
        
        case "1": {
            
            this.player1Eaten.push("greenFrog");
            break;
        }
        
        case "2": {
            
            this.player1Eaten.push("yellowFrog");
            break;
        }
        
        case "3": {
            
            this.player1Eaten.push("redFrog");
            break;
        }
        
        case "4": {
            
            this.player1Eaten.push("blueFrog");
            break;
        }
    }
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