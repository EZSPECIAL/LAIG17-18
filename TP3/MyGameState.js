/**
 * MyGameState class, handles game state and communication with the game server
 * @constructor
 */
function MyGameState(scene) {
    
    this.scene = scene;
    
    // State / Event enumerators
    this.stateEnum = Object.freeze({INIT: 0, WAIT_BOARD: 1, WAIT_FIRST_PICK: 2, VALIDATE_FIRST_PICK: 3, WAIT_PICK: 4});
    this.eventEnum = Object.freeze({BOARD_REQUEST: 0, BOARD_LOAD: 1, FIRST_PICK: 2, NOT_VALID: 3, VALID: 4});

    // Dynamic game vars
    this.frogletBoard; // Game board
    this.frogs = []; // All the frogs on the board
    this.state = this.stateEnum.INIT; //Current game state
    
    this.boardLoaded = false; // Has board been received from Prolog server
    
    this.pickedObject = 0; // Picked object ID

    this.replyFlag = false; // Is a reply available?
    this.lastReply = []; // Last reply received from Prolog server
    
    this.selectedCoords = []; // Most recent cell selection coordinates
    
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

            this.selectedCoords = this.parsePickAsBoardCoords(pickID);

            this.scene.makeRequest("selectCell(" + this.convertBoardToProlog() + ",first," + this.selectedCoords[1] + "," + this.selectedCoords[0] + ")");
            this.stateMachine(this.eventEnum.FIRST_PICK);
            
            break;
        }
        
        // Receive from server if picked cell was valid (green frog)
        case this.stateEnum.VALIDATE_FIRST_PICK: {
            
            if(!this.isReplyAvailable()) return;
            
            if(this.lastReply == 'false') {
                this.stateMachine(this.eventEnum.NOT_VALID);
            } else {
                
                this.removeFromBoard(this.selectedCoords);
                this.stateMachine(this.eventEnum.VALID);
            }

            break;
        }
        
        // Wait on user to pick a frog to jump
        case this.stateEnum.WAIT_PICK: {
            
            
            
            
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
                this.state = this.stateEnum.WAIT_PICK;
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
                    
                    this.frogs.push(new MyFrog("greenFrog"));
                    break;
                }
                
                case "2": {
                    
                    this.frogs.push(new MyFrog("yellowFrog"));
                    break;
                }
                
                case "3": {
                    
                    this.frogs.push(new MyFrog("redFrog"));
                    break;
                }
                
                case "4": {
                    
                    this.frogs.push(new MyFrog("blueFrog"));
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
 * Gets board x/y coords from pick ID
 */
MyGameState.prototype.parsePickAsBoardCoords = function(pickID) {
    
    let pickIndex = pickID - 1;
    
    let boardY = ~~(pickIndex / 12); //Integer division to find row
    let boardX = pickIndex - boardY * 12;
    
    return [boardX, boardY];
}