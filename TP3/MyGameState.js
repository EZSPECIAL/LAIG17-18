/**
 * MyGameState class, handles game state and communication with the game server
 * @constructor
 */
function MyGameState(scene) {
    
    this.scene = scene;
    
    this.stateEnum = Object.freeze({INIT: 0, WAIT_BOARD: 1, PLAYER1: 2, PLAYER2: 3}); //Possible game states
    this.eventEnum = Object.freeze({BOARD_REQUEST: 0, BOARD_LOAD: 1}); //Possible game events
    
    this.state = this.stateEnum.INIT; //Current game state
    this.frogletBoard; //Game board
    
    this.replyFlag = false; //Is a reply available?
    this.lastReply = []; //Last reply received from Prolog server
    
    this.pickedObject = 0; //Picked object ID
    
    //Game vars loaded from LSX
    this.boardSize = 0;
}

/**
 * Update game state according to current events
 */
MyGameState.prototype.updateGameState = function() {
    
    switch(this.state) {
        
        //Request initial board from server
        case this.stateEnum.INIT: {
            
            this.scene.makeRequest("genBoard");
            this.stateMachine(this.eventEnum.BOARD_REQUEST);
            break;
        }
        
        //Wait on board and parse it when ready
        case this.stateEnum.WAIT_BOARD: {
            
            if(this.replyFlag) {
                
                this.frogletBoard = this.parseBoard(this.lastReply);
                this.replyFlag = false;
                this.stateMachine(this.eventEnum.BOARD_LOAD);
            }
            
            break;
        }
        
        case this.stateEnum.PLAYER1: {
            
            if(this.pickedObject != 0) {
                
                let coords = this.parsePickAsBoardCoords(this.pickedObject);
                console.log("Board value:" + this.frogletBoard[coords[1]][coords[0]]); //TODO temp log
                
                this.pickedObject = 0;
            }
            
            break;
        }
    }
}

/**
 * Game state machine, receives event and checks transitions available
 */
MyGameState.prototype.stateMachine = function(event) {
    
    switch(event) {
        
        case this.eventEnum.BOARD_REQUEST: {
            
            console.log("Froglet board requested.");
            this.state = this.stateEnum.WAIT_BOARD;
            break;
        }
        
        case this.eventEnum.BOARD_LOAD: {
            
            console.log("Froglet board loaded!");
            this.state = this.stateEnum.PLAYER1;
            break;
        }
    }
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
 * Gets board x/y coords from pick ID
 */
MyGameState.prototype.parsePickAsBoardCoords = function(pickID) {
    
    let pickIndex = pickID - 1;
    
    let boardY = ~~(pickIndex / 12); //Integer division to find row
    let boardX = pickIndex - boardY * 12;
    
    return [boardX, boardY];
}