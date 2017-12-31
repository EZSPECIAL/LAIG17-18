/**
 * MyGameState class, handles game state and communication with the game server
 * @constructor
 */
function MyGameState(scene) {
    
    // Establish a reference to scene
    this.scene = scene;
    
    // Game state keeps graph object
    this.graph;
    
    // State / Event enumerators
    this.stateEnum = Object.freeze({INIT_GAME: 0, WAIT_BOARD: 1, WAIT_FIRST_PICK: 2, VALIDATE_FIRST_PICK: 3, WAIT_PICK_FROG: 4, WAIT_PICK_CELL: 5, VALIDATE_MOVE: 6, JUMP_ANIM: 7, CAMERA_ANIM: 8, WAIT_NEW_GAME: 9, VALIDATE_AI: 10, VALIDATE_OVER: 11, MOVIE: 12, FIRST_PICK_ANIM: 13, STOP_MOVIE: 14, VALIDATE_MULTIPLE_JUMP: 15});
    this.eventEnum = Object.freeze({BOARD_REQUEST: 0, BOARD_LOAD: 1, FIRST_PICK: 2, NOT_VALID: 3, VALID: 4, PICK: 5, FINISHED_ANIM: 6, TURN_TIME: 7, UNDO: 8, START: 9, CAMERA_NG_FIX: 10, AI_MOVE: 11, OVER: 12, UNDO_MULTIPLE: 13});
    
    // Is current state an animation state or Prolog validation state?
    this.animationStates = Object.freeze([this.stateEnum.JUMP_ANIM, this.stateEnum.CAMERA_ANIM, this.stateEnum.FIRST_PICK_ANIM]);
    this.validationStates = Object.freeze([this.stateEnum.VALIDATE_FIRST_PICK, this.stateEnum.VALIDATE_MOVE, this.stateEnum.VALIDATE_AI, this.stateEnum.VALIDATE_OVER, this.stateEnum.VALIDATE_MULTIPLE_JUMP]);
    this.noTimerStates = Object.freeze([this.stateEnum.WAIT_NEW_GAME, this.stateEnum.MOVIE, this.stateEnum.STOP_MOVIE]);
    
    // Where can player start new game / undo moves / play movie
    this.undoStates = Object.freeze([this.stateEnum.WAIT_PICK_FROG, this.stateEnum.WAIT_PICK_CELL]);
    this.newGameStates = Object.freeze([this.stateEnum.WAIT_NEW_GAME, this.stateEnum.WAIT_FIRST_PICK, this.stateEnum.WAIT_PICK_FROG, this.stateEnum.WAIT_PICK_CELL, this.stateEnum.JUMP_ANIM]);
    this.movieStates = Object.freeze([this.stateEnum.WAIT_NEW_GAME, this.stateEnum.WAIT_PICK_FROG]);
    this.confirmAIStates = Object.freeze([this.stateEnum.WAIT_FIRST_PICK, this.stateEnum.WAIT_PICK_FROG]);
    
    // Available game modes (set to this.isPlayerHuman array)
    this.gameModes = [[true, true], [true, false], [false, true], [false, false]];
    
    // Timer limits for visual feedback
    this.buttonTimeLimit = Object.freeze(500);
    this.validTimeLimit = Object.freeze(500);
 
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
    this.undoMultipleJumpI = Object.freeze(6);
 
    // Loaded from <GAME_VAR> in LSX
    this.boardSize = 0;
    
    // Button UI variables
    this.buttonPressed = "none";
    this.buttonTimer = 0;
    
    // Init game to default values
    this.resetGame();
}

/**
 * Reset all game variables that affect the game logic
 */
MyGameState.prototype.resetGame = function() {
    
    // Game state variables
    this.frogletBoard = [];
    this.undoBoards = [];
    this.frogs = []; // All the MyFrog objects on the board
    this.state = this.stateEnum.WAIT_NEW_GAME;

    // Movie variables
    this.initFrogletBoard = [];
    this.firstPick = [];
    this.movieBoard = [];
    this.movieFrogs = [];
    this.movieP1Eaten = [];
    this.movieP2Eaten = [];
    this.previousP1Score = 0;
    this.previousP2Score = 0;
    this.isPreviousPlayer1 = true;
    this.previousSelectedCell = [];
    this.previousSelectedFrog = [];
    this.previousState;
    this.movieIndex = 0;
    this.movieJumpF = false;
    this.movieHopF = false;
    this.movieHopFinished = false;
    this.playingMovie = false;
    this.movieCameraSetF = false;
    
    // Logic / UI flags
    this.boardLoaded = false;
    this.pickingFrogs = true; // Determines picking cells active
    this.isPlayer1 = true;
    this.animateCamera = true;
    this.validFirstMove = false; // Used for player feedback and AI deciding between first pick or jump
    this.validTimer = 0; // Time (ms) to flash wrong frog
    this.newGameFlag = false;
    this.computerMovedF = false;
    this.computerMove = [];
    this.computerPoints = "0";
    this.isGamePaused = false;
    this.allowUnpause = true;
    this.allowUndo = true;
    this.gameOverF = true;
    this.allowAIFlag = false;
    this.undoFlag = false;
    this.multipleJumpFlag = false;
    
    // Selection variables
    this.pickedObject = 0; // Picked object ID
    this.selectedFrog = []; // Move source coords
    this.selectedCell = []; // Move destination coords
    
    // Server variables
    this.replyFlag = false; // Is a reply available?
    this.lastReply = []; // Last reply received from Prolog server
    
    // Game mode variables
    this.isPlayerHuman = [true, false] // Array with boolean values for both players
    this.playerDiffs = ["easy", "easy"]; // Array with string values of difficulty for both AI
    
    // Player score variables
    this.player1Score = 0;
    this.player2Score = 0;
    this.player1Eaten = []; // List of node IDs of eaten frogs
    this.player2Eaten = []; // List of node IDs of eaten frogs
    
    // Game turn variables
    this.turnTime = 0;
    this.turnTimeLimit = 0;
    this.turnActive = false;
    
    // Keyboard key pressed string
    this.lastKeyPress = "none";

    // CSS for state logging messages
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
    
    // Check for game pause
    if(this.isGamePaused) return;
    
    // Movie handling states, continues playing or stops movie
    if(this.state == this.stateEnum.MOVIE) {
        
        this.playMovie();
        return;
    } else if(this.state == this.stateEnum.STOP_MOVIE) {
        
        this.stopMovie();
        return;
    }
    
    // Check for scene change
    if(this.checkSceneChange()) return;
    
    // Picking menus checks
    this.undoCheck(); // Undo move up to start of game
    this.playCheck(); // Start a new game
    
    this.lastKeyPress = "none";
    
    // Update DAT GUI button status
    this.playMovieButtonCheck();
    this.confirmAIButtonCheck();
    
    // Update timers
    this.buttonTimer = this.updateTimer(deltaT, this.buttonTimer);
    this.validTimer = this.updateTimer(deltaT, this.validTimer);
    
    // Update turn time and current player turn
    this.updateTurn(deltaT);
    
    switch(this.state) {
        
        // New game state, clears picking ID only, menu button handling is done in a previous block
        case this.stateEnum.WAIT_NEW_GAME: {

            this.isBoardPicked();
            break;
        }
        
        // Request initial board from server
        case this.stateEnum.INIT_GAME: {
            
            this.scene.makeRequest("genBoard");
            this.stateMachine(this.eventEnum.BOARD_REQUEST);
            
            break;
        }
        
        // Wait on board request and parse it when ready
        case this.stateEnum.WAIT_BOARD: {
            
            if(!this.isReplyAvailable()) return;
            
            this.frogletBoard = this.parseBoard(this.lastReply);
            this.initFrogletBoard = this.parseBoard(this.lastReply);
            
            // Parse board failed
            if(this.frogletBoard.length <= 0) return;
            
            this.frogs = this.createFrogs(this.frogletBoard);
            
            this.boardLoaded = true;

            this.stateMachine(this.eventEnum.BOARD_LOAD);

            break;
        }
        
        // Wait on user to pick a green frog
        case this.stateEnum.WAIT_FIRST_PICK: {

            // Check if current player is human
            let currentPlayer = this.isPlayer1 ? 0 : 1;
            
            // Request Prolog first AI move if player is AI and hasn't moved yet
            if(!this.isPlayerHuman[currentPlayer] && !this.computerMovedF && this.allowAIFlag) {
                
                // Request AI move according to difficulty
                this.scene.makeRequest("cpuFirstMove(" + this.convertBoardToProlog() + ")");
                this.stateMachine(this.eventEnum.AI_MOVE);
                break;
            // Animate AI selected frog and advance state
            } else if(!this.isPlayerHuman[currentPlayer] && this.computerMovedF) {

                this.computerMovedF = false;
                this.allowAIFlag = false;
                
                // Spoof server reply
                this.lastReply = 'true';
                this.replyFlag = true;
                
                this.stateMachine(this.eventEnum.FIRST_PICK);
                break;
            }

            let pickID;
            if((pickID = this.isBoardPicked()) == 0) return;
            
            // Allow picking on AI turn but don't allow it to affect turn
            if(!this.isPlayerHuman[currentPlayer]) break;

            this.selectedFrog = this.indexToBoardCoords(pickID - 1);

            this.scene.makeRequest("selectCell(" + this.convertBoardToProlog() + ",first," + this.selectedFrog[1] + "," + this.selectedFrog[0] + ")");
            this.stateMachine(this.eventEnum.FIRST_PICK);
            
            break;
        }
        
        // Receive from server if picked cell was valid (green frog)
        case this.stateEnum.VALIDATE_FIRST_PICK: {
            
            if(!this.isReplyAvailable()) return;
            
            if(this.lastReply == 'false') {
                
                this.validFirstMove = false;
                this.validTimer = this.validTimeLimit; // Start timer for shader
                this.stateMachine(this.eventEnum.NOT_VALID);
            } else {
             
                // Reset shader feedback on wrong selection
                this.validFirstMove = true;
                this.validTimer = 0;
                
                this.firstPick = this.selectedFrog.slice(); // Store first move for movie
                
                // Frog hop animation
                if(this.scene.frogAnim) this.frogs[this.selectedFrog[0] + this.selectedFrog[1] * 12].frogHopAnim(this.scene.frogAnimSpeed);
                
                this.stateMachine(this.eventEnum.VALID);
            }

            break;
        }
        
        // Animate first pick frog with short hop
        case this.stateEnum.FIRST_PICK_ANIM: {
            
            // Wait for hop to finish
            if(this.frogs[this.selectedFrog[0] + this.selectedFrog[1] * 12].animationHandler.finished) {

                this.frogs[this.selectedFrog[0] + this.selectedFrog[1] * 12].animationHandler.resetMatrix();

                this.removeFromBoard(this.selectedFrog);
                this.selectedFrog = [];
                
                this.stateMachine(this.eventEnum.FINISHED_ANIM);
            }
            
            break;
        }
        
        // Wait on user to pick a frog to jump
        case this.stateEnum.WAIT_PICK_FROG: {

            // Check if current player is human
            let currentPlayer = this.isPlayer1 ? 0 : 1;
            
            // Request Prolog AI move if player is AI and hasn't moved yet
            if(!this.isPlayerHuman[currentPlayer] && !this.computerMovedF && this.allowAIFlag) {
                
                // Request AI move according to difficulty
                this.turnActive = false; // Turn off AI timer
                this.scene.makeRequest("cpuMove(" + this.convertBoardToProlog() + "," + this.playerDiffs[currentPlayer] + ")");
                this.stateMachine(this.eventEnum.AI_MOVE);
                break;
            // Animate AI selected frog and advance state
            } else if(!this.isPlayerHuman[currentPlayer] && this.computerMovedF) {
                
                // Frog hop animation
                if(this.scene.frogAnim) this.frogs[this.selectedFrog[0] + this.selectedFrog[1] * 12].frogHopAnim(this.scene.frogAnimSpeed);
                
                this.computerMovedF = false;
                this.allowAIFlag = false;
                
                this.stateMachine(this.eventEnum.PICK);
                break;
            }

            if(!this.turnActive) {
                
                // Activate turn time since next state will be the game loop
                this.turnTime = this.turnTimeLimit;
                this.turnActive = true;
            }
            
            let pickID;
            if((pickID = this.isBoardPicked()) == 0) return;

            // Allow picking on AI turn but don't allow it to affect turn
            if(!this.isPlayerHuman[currentPlayer]) break;
            
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
            
            // Check if current player is human
            let currentPlayer = this.isPlayer1 ? 0 : 1;
            
            // If AI player skip Prolog move validation since Prolog chose the AI move
            if(!this.isPlayerHuman[currentPlayer]) {

                this.stateMachine(this.eventEnum.PICK);
                break;
            }

            let pickID;
            if((pickID = this.isBoardPicked()) == 0) return;

            this.selectedCell = this.indexToBoardCoords(pickID - 1);
            
            // Update frog selection in case player changes their mind
            if(this.frogletBoard[this.selectedCell[1]][this.selectedCell[0]] != "0" && !this.multipleJumpFlag) {
                
                this.validTimer = 0; // Turn off highlighting of wrong selection in case player managed to select a frog before it ran out
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
            
            // Check if current player is human
            let currentPlayer = this.isPlayer1 ? 0 : 1;
            
            if(this.isPlayerHuman[currentPlayer]) {
            
                if(!this.isReplyAvailable()) return;
            }
            
            if(this.lastReply == "0" && this.isPlayerHuman[currentPlayer]) {
                
                // Reset player selection
                this.validTimer = this.validTimeLimit; // Start timer for shader
                
                this.pickingFrogs = false;
                this.selectedCell = [];
                this.stateMachine(this.eventEnum.NOT_VALID);
            } else {
                
                // Turn off highlighting of wrong selection
                this.validTimer = 0;
                
                this.turnActive = false;

                if(!this.isPlayerHuman[currentPlayer]) this.lastReply = this.computerPoints; // Reply would've been string with point value, set it to computer move points string
                
                // Update score according to player
                if(this.isPlayer1) this.player1Score += parseInt(this.lastReply);
                else this.player2Score += parseInt(this.lastReply);

                // Add frog to current player eaten frogs array
                this.eatFrog(this.lastReply);

                // Edit board and display frogs for jump effect, also stores move for undoing
                this.frogJump(this.selectedFrog, this.selectedCell);

                // Ask Prolog server if game is over
                this.scene.makeRequest("endGame(" + this.convertBoardToProlog() + ")");
                
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
                
                if(this.undoFlag) {

                    this.stateMachine(this.eventEnum.UNDO);
                } else this.stateMachine(this.eventEnum.FINISHED_ANIM);
            }
            
            break;
        }
        
        // Play out camera animation
        case this.stateEnum.CAMERA_ANIM: {

            if(this.scene.updatePlayerCameraPos(this.isPlayer1)) {

                // If new game send different event to alter transition
                if(this.newGameFlag) {
                    
                    this.newGameFlag = false;
                    this.stateMachine(this.eventEnum.CAMERA_NG_FIX);
                    break;
                    
                // Camera fix and transition depending on undo state
                } else if(this.undoFlag) {
                    
                    this.undoFlag = false;
                    if(this.multipleJumpFlag) {
                        
                        this.stateMachine(this.eventEnum.UNDO_MULTIPLE);
                        break;
                    }
                } 
                
                this.stateMachine(this.eventEnum.FINISHED_ANIM);
            }
            
            break;
        }
        
        // Request AI move from Prolog
        case this.stateEnum.VALIDATE_AI: {
            
            if(!this.isReplyAvailable()) return;

            if(!this.validFirstMove) {
                
                this.computerMove = this.parseAIFirstMove(this.lastReply);

                this.selectedFrog = this.computerMove.slice();
                
                this.computerMovedF = true;
                this.stateMachine(this.eventEnum.FIRST_PICK);
                
            } else { 
            
                this.computerMove = this.parseAIMove(this.lastReply);
            
                this.selectedFrog = this.computerMove[0].slice(); // Source
                this.selectedCell = this.computerMove[1].slice(); // Destination
                this.computerPoints = this.computerMove[2].slice(); // Move points
            
                this.computerMovedF = true;
                this.stateMachine(this.eventEnum.VALID);
            }

            break;
        }
        
        // Wait for server to reply if game is over
        case this.stateEnum.VALIDATE_OVER: {
            
            if(!this.isReplyAvailable()) return;
            
            if(this.lastReply == 'true') {
                
                // Reveal new game folder
                this.scene.interface.openFolder("New Game");
                this.gameOverF = true;
                this.stateMachine(this.eventEnum.OVER);
            } else {
                
                // Reset multiple jump and verify if possible from current destination
                this.scene.makeRequest("multipleJump(" + this.convertBoardToProlog(this.frogletBoard) + "," + this.selectedCell[0] + "," + this.selectedCell[1] + ")");
                this.stateMachine(this.eventEnum.VALID);
            }
            
            break;
        }
        
        // Request Prolog server if more moves are available from current destination
        case this.stateEnum.VALIDATE_MULTIPLE_JUMP: {
            
            if(!this.isReplyAvailable()) return;
            
            if(this.lastReply == 'true') {
                
                // Prepare for multiple jump
                let selectedFrog = this.selectedCell.slice();
                this.resetTurn();
                
                // Updates values needed for multiple jumping
                this.multipleJumpSetup(selectedFrog);
                
                this.stateMachine(this.eventEnum.VALID);
            } else if(this.lastReply == 'false') {
                
                // Toggle player since multiple jump is not possible
                this.isPlayer1 = !this.isPlayer1;
                this.resetTurn();
                
                this.stateMachine(this.eventEnum.NOT_VALID);
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
        
        case this.stateEnum.WAIT_NEW_GAME: {
            
            if(event == this.eventEnum.START) {
                console.log("%c Starting new game.", this.gameMessageCSS);
                this.state = this.stateEnum.CAMERA_ANIM;
            }
            
            break;
        }
        
        case this.stateEnum.INIT_GAME: {
            
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
            } else if(event == this.eventEnum.START) {
                console.log("%c Starting new game.", this.gameMessageCSS);
                this.state = this.stateEnum.CAMERA_ANIM;
            } else if (event == this.eventEnum.AI_MOVE) {
                console.log("%c AI picking first move.", this.gameMessageCSS);
                this.state = this.stateEnum.VALIDATE_AI;
            }
            
            break;
        }
        
        case this.stateEnum.VALIDATE_FIRST_PICK: {
            
            if(event == this.eventEnum.NOT_VALID) {
                console.log("%c Not a green frog!", this.gameMessageCSS);
                this.state = this.stateEnum.WAIT_FIRST_PICK;
            } else if(event == this.eventEnum.VALID) {
                console.log("%c Green frog removed.", this.gameMessageCSS);
                this.state = this.stateEnum.FIRST_PICK_ANIM;
            }
            
            break;
        }
        
        case this.stateEnum.FIRST_PICK_ANIM: {
            
            if(event == this.eventEnum.FINISHED_ANIM) {
                
                this.state = this.stateEnum.WAIT_PICK_FROG;
            }
            
            break;
        }
        
        case this.stateEnum.WAIT_PICK_FROG: {
            
            if(event == this.eventEnum.PICK) {
                this.state = this.stateEnum.WAIT_PICK_CELL;
            } else if(event == this.eventEnum.TURN_TIME) {
                this.state = this.stateEnum.CAMERA_ANIM;
            } else if(event == this.eventEnum.UNDO) {
                this.state = this.stateEnum.JUMP_ANIM;
            } else if(event == this.eventEnum.START) {
                console.log("%c Starting new game.", this.gameMessageCSS);
                this.state = this.stateEnum.CAMERA_ANIM;
            } else if(event == this.eventEnum.AI_MOVE) {
                console.log("%c AI Moves next.", this.gameMessageCSS);
                this.state = this.stateEnum.VALIDATE_AI;
            }
            
            break;
        }
        
        case this.stateEnum.WAIT_PICK_CELL: {
            
            if(event == this.eventEnum.PICK) {
                this.state = this.stateEnum.VALIDATE_MOVE;
            } else if(event == this.eventEnum.TURN_TIME) {
                this.state = this.stateEnum.CAMERA_ANIM;
            } else if(event == this.eventEnum.UNDO) {
                this.state = this.stateEnum.JUMP_ANIM;
            } else if(event == this.eventEnum.START) {
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
                this.state = this.stateEnum.VALIDATE_OVER;
            } else if(event == this.eventEnum.START) {
                this.state = this.stateEnum.CAMERA_ANIM;
            }  else if(event == this.eventEnum.UNDO) {
                console.log("%c Undo move finished!", this.gameMessageCSS);
                this.state = this.stateEnum.CAMERA_ANIM;
            }
            
            break;
        }
        
        case this.stateEnum.CAMERA_ANIM: {
            
            if(event == this.eventEnum.FINISHED_ANIM) {
                this.state = this.stateEnum.WAIT_PICK_FROG;
            } else if(event == this.eventEnum.CAMERA_NG_FIX) {
                this.state = this.stateEnum.INIT_GAME;
            } else if(event == this.eventEnum.UNDO_MULTIPLE) {
                console.log("%c Undo multiple finished!", this.gameMessageCSS);
                this.state = this.stateEnum.WAIT_PICK_CELL;
            }
            
            break;
        }
        
        case this.stateEnum.VALIDATE_AI: {
            
            if(event == this.eventEnum.VALID) {
                console.log("%c AI Moved.", this.gameMessageCSS);
                this.state = this.stateEnum.WAIT_PICK_FROG;
            } else if(event == this.eventEnum.FIRST_PICK) {
                this.state = this.stateEnum.WAIT_FIRST_PICK;
            }
            
            break;
        }
        
        case this.stateEnum.VALIDATE_OVER: {
            
            if(event == this.eventEnum.VALID) {
                console.log("%c Game over checked.", this.gameMessageCSS);
                this.state = this.stateEnum.VALIDATE_MULTIPLE_JUMP;
            } else if(event == this.eventEnum.OVER) {
                console.log("%c Game over!", this.gameMessageCSS);
                this.state = this.stateEnum.WAIT_NEW_GAME;
            }
            
            break;
        }
        
        case this.stateEnum.VALIDATE_MULTIPLE_JUMP: {
            
            if(event == this.eventEnum.VALID) {
                
                console.log("%c Multiple jump allowed!", this.gameMessageCSS);
                this.state = this.stateEnum.WAIT_PICK_CELL;
            } else if(event == this.eventEnum.NOT_VALID) {
                
                this.state = this.stateEnum.CAMERA_ANIM;
            }
            
            break;
        }
    }
    
    this.pickedObject = 0; // Dismiss selection during state change
    this.lastKeypress = "none"; // Dismiss keypresses during state change
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
 * Updates game pause state and changes "New Game" GUI folder status
 */
MyGameState.prototype.updatePause = function(pauseValue, animateCameraF) {
    
    // Toggle lights and "New Game" folder
    if(!animateCameraF) {
        if(this.isGamePaused) {
            
            this.scene.enableLights();
            this.scene.interface.closeFolder("New Game");
        } else {
            
            this.scene.disableLights();
            this.scene.interface.openFolder("New Game");
        }
        
        this.scene.interface.openFolder("Movie");
        this.scene.interface.closeFolder("Lights");
    }
    
    this.isGamePaused = pauseValue;
}

/**
 * Allow AI to choose move
 */
MyGameState.prototype.confirmAI = function() {
    
    if(!this.confirmAIButtonCheck()) return;

    this.allowAIFlag = true;
}

/**
 * Updates a button with specified style string
 */
MyGameState.prototype.buttonSetStyle = function(buttonI, style) {
    
    if(style === "allow") {
        
        this.scene.interface.updateButtonStyleProperty(buttonI, "background-color", "#99ff99");
        this.scene.interface.updateButtonStyleProperty(buttonI, "text-shadow", "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black");
        return;
    }
   
    if(style === "deny") {

        this.scene.interface.updateButtonStyleProperty(buttonI, "background-color", "#ff9999");
        this.scene.interface.updateButtonStyleProperty(buttonI, "text-shadow", "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black");
        return;
    }
}

/**
 * Updates confirm AI button text
 */
MyGameState.prototype.confirmAIButtonCheck = function() {
 
    // Is AI on auto play?
    if(this.scene.alwaysAllowAI) this.allowAIFlag = true;
 
    let currPlayer = this.isPlayer1 ? 0 : 1;
 
    // Don't allow moving AI if current player is not an AI, or current state is not picking frogs stage, or computer has already chose a move
    if(this.isPlayerHuman[currPlayer] || (!this.confirmAIStates.includes(this.state)) || this.computerMovedF || this.scene.alwaysAllowAI) {

        this.scene.interface.updateControllerText("Froglet", "confirmAI", "Do AI Move - not allowed!");
        this.buttonSetStyle(this.scene.interface.confirmAIButtonI, "deny");
        return false;
    } else {

        this.scene.interface.updateControllerText("Froglet", "confirmAI", "Do AI Move");
        this.buttonSetStyle(this.scene.interface.confirmAIButtonI, "allow");
        return true;
    }
}

/**
 * Reset AI flag on UI change so next AI turn isn't skipped when user toggles auto play
 */
MyGameState.prototype.onAIAllowChange = function(value) {

    this.allowAIFlag = false;
}

/**
 * Setup flags and values for multiple jump
 */
MyGameState.prototype.multipleJumpSetup = function(selectedFrog) {
   
    this.selectedFrog = selectedFrog.slice(); // Force frog to be the same source as last move
    this.pickingFrogs = false; // Only allow picking empty cells
    this.turnActive = true; // Continue counting down
    this.multipleJumpFlag = true;
}

/**
 * Handles movie playback
 */
MyGameState.prototype.playMovie = function() {

    // Replay first pick
    if(this.movieIndex == 0 && !this.movieHopF) {
        
        // Reset to player 1
        if(!this.scene.updatePlayerCameraPos(true)) return;
        
        this.selectedFrog = this.firstPick.slice();
        
        // Hop animation on first pick
        if(this.scene.frogAnim) this.movieFrogs[this.selectedFrog[0] + this.selectedFrog[1] * 12].frogHopAnim(this.scene.frogAnimSpeed);
        this.movieHopF = true;
        return;
    
    // Wait for hop animation and remove frog afterwards
    } else if(this.movieIndex == 0) {
        
        // Wait for hop to finish
        if(!this.movieFrogs[this.selectedFrog[0] + this.selectedFrog[1] * 12].animationHandler.finished) return;
        
        this.movieFrogs[this.selectedFrog[0] + this.selectedFrog[1] * 12].animationHandler.resetMatrix();
        
        this.movieBoard[this.selectedFrog[1]][this.selectedFrog[0]] = "0";
        this.movieFrogs[this.selectedFrog[0] + this.selectedFrog[1] * 12].nodeID = null;
        
        this.movieIndex++;
        this.movieHopF = false;

        return;
    }

    // Replay moves sequentially
    let undoBoard = this.undoBoards[this.movieIndex - 1];

    // Set camera and player to player moving
    if(!this.movieCameraSetF) {
        
        this.isPlayer1 = undoBoard[this.undoCurrPlayerI];
        if(!this.scene.updatePlayerCameraPos(this.isPlayer1)) return;
        
        this.movieCameraSetF = true;
        return;
    }
    
    // Alter internal board state and display
    this.selectedFrog = undoBoard[this.undoFrogI].slice();
    this.selectedCell = undoBoard[this.undoCellI].slice();
    
    if(!this.movieHopF) {
        
        if(this.scene.frogAnim) this.movieFrogs[this.selectedFrog[0] + this.selectedFrog[1] * 12].frogHopAnim(this.scene.frogAnimSpeed);
        this.movieHopF = true;
    } else if(!this.movieJumpF && this.movieHopFinished) {

        this.movieJump(this.selectedFrog, this.selectedCell);
        this.movieEatFrog(undoBoard[this.undoMidNodeI], undoBoard[this.undoCurrPlayerI]);
        
        // Check player and update score
        let isPlayer1 = undoBoard[this.undoCurrPlayerI];
        if(isPlayer1) this.player1Score += undoBoard[this.undoPointsI];
        else this.player2Score += undoBoard[this.undoPointsI];
        
        // Start frog jump animation
        if(this.scene.frogAnim) this.movieFrogs[this.selectedCell[0] + this.selectedCell[1] * 12].frogJumpAnim(this.selectedFrog, this.selectedCell, this.scene.frogAnimSpeed);
        this.movieJumpF = true;
    }
    
    if(this.movieHopFinished) {
        
        // Wait for jump to finish
        if(!this.movieFrogs[this.selectedCell[0] + this.selectedCell[1] * 12].animationHandler.finished) return;
        this.movieFrogs[this.selectedCell[0] + this.selectedCell[1] * 12].animationHandler.resetMatrix();
    } else {
        
        // Wait for hop to finish
        if(!this.movieFrogs[this.selectedFrog[0] + this.selectedFrog[1] * 12].animationHandler.finished) return;
        
        this.movieFrogs[this.selectedFrog[0] + this.selectedFrog[1] * 12].animationHandler.resetMatrix();
        this.movieHopFinished = true;
        return;
    }

    this.movieHopF = false;
    this.movieJumpF = false;
    this.movieHopFinished = false;
    this.movieCameraSetF = false;

    this.movieIndex++;
    
    // No more moves, reset and stop movie
    if(this.movieIndex > this.undoBoards.length) this.stopMovieButton();
}

/**
 * Stops movie playback
 */
MyGameState.prototype.stopMovie = function() {

    // Reset to original game player
    if(!this.scene.updatePlayerCameraPos(this.isPreviousPlayer1)) return;

    this.restoreGameFromMovie();
}

/**
 * Restore game state from movie start
 */
MyGameState.prototype.restoreGameFromMovie = function() {
    
    this.playingMovie = false;
    this.scene.interface.updateControllerText("Movie", "stopMovieButton", "Stop Movie - not allowed!");
    this.buttonSetStyle(this.scene.interface.stopMovieButtonI, "deny");
  
    // Restore game state
    this.player1Score = this.previousP1Score;
    this.player2Score = this.previousP2Score;
    this.isPlayer1 = this.isPreviousPlayer1;
    this.selectedCell = this.previousSelectedCell.slice();
    this.selectedFrog = this.previousSelectedFrog.slice();
    
    // Reset picking in case player decided to interact
    this.pickedObject = 0;
    this.lastKeyPress = "none";
    
    this.state = this.previousState;
    
    console.log("%c Movie stopped/finished!", this.gameMessageCSS);
}

/**
 * Reset movie variables
 */
MyGameState.prototype.resetMovie = function() {
    
    this.movieP1Eaten = [];
    this.movieP2Eaten = [];
    this.movieIndex = 0;
    this.movieJumpF = false;
    this.movieHopF = false;
    this.movieHopFinished = false;
    this.movieCameraSetF = false;
}

/**
 * Starts movie playback
 */
MyGameState.prototype.playMovieButton = function() {
    
    if(!this.playMovieButtonCheck()) return;

    console.log("%c Starting movie.", this.gameMessageCSS);
    
    // Copy board and create movie only frogs
    this.movieBoard = this.initFrogletBoard.map(a => Object.assign({}, a));
    this.movieFrogs = this.createFrogs(this.movieBoard);

    // Reset movie variables
    this.resetMovie();
    
    // Keep scores and player from current game
    this.previousP1Score = this.player1Score;
    this.previousP2Score = this.player2Score;
    this.isPreviousPlayer1 = this.isPlayer1;
    this.previousSelectedCell = this.selectedCell.slice();
    this.previousSelectedFrog = this.selectedFrog.slice();
    this.selectedFrog = [];
    this.selectedCell = [];
    
    this.player1Score = 0;
    this.player2Score = 0;
    this.isPlayer1 = true;
    
    this.playingMovie = true;
    
    // Update button styles
    this.scene.interface.updateControllerText("Movie", "playMovieButton", "Play Movie - not allowed!");
    this.buttonSetStyle(this.scene.interface.playMovieButtonI, "deny");
    
    this.scene.interface.updateControllerText("Movie", "stopMovieButton", "Stop Movie");
    this.buttonSetStyle(this.scene.interface.stopMovieButtonI, "allow");
    
    // Change state and store current game state
    this.previousState = this.state;
    this.state = this.stateEnum.MOVIE;
}

/**
 * Stop movie from playing if movie is playing
 */
MyGameState.prototype.stopMovieButton = function() {
    
    if(this.state != this.stateEnum.MOVIE) return;

    this.scene.interface.updateControllerText("Movie", "stopMovieButton", "Stop Movie - not allowed!");
    this.buttonSetStyle(this.scene.interface.stopMovieButtonI, "deny");
    
    // Update scoreboard player at start of stopping movie to mimic real game
    this.isPlayer1 = this.isPreviousPlayer1;
    this.state = this.stateEnum.STOP_MOVIE;
}

/**
 * Toggles movie state if allowed
 */
MyGameState.prototype.toggleMovieKey = function() {
    
    if(this.state == this.stateEnum.MOVIE) this.stopMovieButton();
    else this.playMovieButton();
}

/**
 * Updates movie button text and returns if playing movie is allowed
 */
MyGameState.prototype.playMovieButtonCheck = function() {
    
    if(this.playingMovie || this.undoBoards.length <= 0) {
        
        this.scene.interface.updateControllerText("Movie", "playMovieButton", "Play Movie - not allowed!");
        this.buttonSetStyle(this.scene.interface.playMovieButtonI, "deny");
        return false;
    }
    
    if(!this.movieStates.includes(this.state)) {
        
        this.scene.interface.updateControllerText("Movie", "playMovieButton", "Play Movie - not allowed!");
        this.buttonSetStyle(this.scene.interface.playMovieButtonI, "deny");
        return false;
    }
    
    this.scene.interface.updateControllerText("Movie", "playMovieButton", "Play Movie");
    this.buttonSetStyle(this.scene.interface.playMovieButtonI, "allow");
    return true;
}
 
/**
 * Changes scene if not animating and DAT GUI scene was change, returns true on scene change
 */
MyGameState.prototype.checkSceneChange = function() {
    
    if(this.scene.lastGraph != this.scene.currentGraph) {

        // Check if current state is an animation state and prevent changing graph until animation finishes
        if(!this.animationStates.includes(this.state)) {

            this.scene.lastGraph = this.scene.currentGraph;
            this.scene.updatingGraph = true;
            return true;
        }
    }
    
    return false;
}

/**
 * Check if undo button was clicked and if so undoes last play, undo format is [frogCoords, cellCoords, originNodeID, midpointNodeID, currentPlayer, points]
 */
MyGameState.prototype.undoCheck = function() {
    
    // Was undo button pressed
    if((this.pickedObject != this.undoPickID) && this.lastKeyPress != "u") return;
    this.lastKeyPress = "none";
    
    this.buttonPress("undoFail");

    // Check if state is valid for undoing
    if(!this.undoStates.includes(this.state)) return;

    // Is there a move to undo
    if(this.undoBoards.length <= 0) return;

    let undoBoard = this.undoBoards[this.undoBoards.length - 1];
    
    // Don't allow undoing past own turn
    if(!this.allowUndo && (this.isPlayer1 != undoBoard[this.undoCurrPlayerI])) return;
    
    this.buttonPress("undoDone");
    
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

    // Reset turn and swap to old player
    this.isPlayer1 = undoBoard[this.undoCurrPlayerI];
    this.resetTurn();

    // Frog jump animation
    this.selectedFrog = undoBoard[this.undoCellI].slice();
    this.selectedCell = undoBoard[this.undoFrogI].slice();
    
    if(this.scene.frogAnim) this.frogs[this.selectedCell[0] + this.selectedCell[1] * 12].reverseFrogJumpAnim(this.selectedFrog, this.selectedCell, this.scene.frogAnimSpeed);
    
    if(undoBoard[this.undoMultipleJumpI]) this.multipleJumpSetup(undoBoard[this.undoFrogI]);
    
    this.undoBoards.pop();
    this.undoFlag = true;
    this.stateMachine(this.eventEnum.UNDO);
}

/**
 * Checks if new game button was pressed and if so resets and setups new game according to DAT GUI values
 */
MyGameState.prototype.playCheck = function() {

    // Was play button pressed
    if((this.pickedObject != this.playGamePickID) && this.lastKeyPress != "s") return;
    this.lastKeyPress = "none";
    
    this.buttonPress("playFail");
    
    // Check if state is valid for starting new game
    if(!this.newGameStates.includes(this.state)) return;
    
    this.buttonPress("playDone");
    
    this.scene.interface.closeFolder("New Game");
    
    // Setup new game
    this.resetGame();
    this.setupGame();
    
    // Send start game event
    this.stateMachine(this.eventEnum.START);
}

/**
 * Setup game variables from DAT GUI
 */
MyGameState.prototype.setupGame = function() {
    
    // Alter GUI state
    this.scene.interface.closeFolder("New Game");
    this.scene.interface.openFolder("Movie");
    this.scene.interface.openFolder("Froglet");
    this.scene.interface.closeFolder("Lights");
    
    this.newGameFlag = true; // For camera reset if needed
    this.gameOverF = false;
    
    // Get new game variables from DAT GUI selection
    this.turnTimeLimit = this.scene.turnTimeLimit * 1000;
    this.isPlayerHuman = this.gameModes[this.scene.currentMode];
    this.playerDiffs = [this.scene.player1Diff, this.scene.player2Diff];
    this.allowUndo = this.scene.allowUndo;
}

/**
 * Reset important turn variables
 */
MyGameState.prototype.resetTurn = function() {
    
    this.selectedCell = [];
    this.selectedFrog = [];
    this.validTimer = 0; // Turn off highlighting of wrong selection since turn reset
    
    this.computerMovedF = false;
    this.pickedObject = 0;
    this.pickingFrogs = true;
    this.multipleJumpFlag = false;
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
            
            let currentPlayer = this.isPlayer1 ? 0 : 1;
            
            this.turnTime = 0;
           
            // Reset turn only if current state is not waiting for server validation
            if(!this.validationStates.includes(this.state) && this.isPlayerHuman[currentPlayer]) {
                
                // Resets turn and swap current player
                this.isPlayer1 = !this.isPlayer1;
                
                this.resetTurn();

                this.stateMachine(this.eventEnum.TURN_TIME);
            } else if(!this.validationStates.includes(this.state) && !this.isPlayerHuman[currentPlayer]) {
                
                // Move AI if turn timed out
                this.allowAIFlag = true;
            }
        }
    }
}

/**
 * Returns whether timer can be drawn
 */
MyGameState.prototype.canDrawTimer = function() {
    
    if(this.noTimerStates.includes(this.state)) return false;
    
    if(this.isGamePaused) return false;
    
    return true;
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
MyGameState.prototype.createFrogs = function(board) {

    let frogs = [];

    for(let y = 0; y < 12; y++) {
        for(let x = 0; x < 12; x++) {

            frogs.push(new MyFrog(this.getFrogColor(board[y][x]), [x, y], this.boardSize));
        }
    }
    
    return frogs;
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
    
    // Was this move a multiple jump?
    myUndo.push(this.multipleJumpFlag);
    
    this.undoBoards.push(myUndo);
}

/**
 * Movie frog jump
 */
MyGameState.prototype.movieJump = function(frogCoords, cellCoords) {
    
    let frogColor = this.movieBoard[frogCoords[1]][frogCoords[0]];
    let midpoint = [(frogCoords[0] + cellCoords[0]) / 2, (frogCoords[1] + cellCoords[1]) / 2];
    
    // Manipulate board values
    this.movieBoard[midpoint[1]][midpoint[0]] = "0";
    this.movieBoard[frogCoords[1]][frogCoords[0]] = "0";
    this.movieBoard[cellCoords[1]][cellCoords[0]] = frogColor;
    
    let frogColorNode = this.movieFrogs[frogCoords[0] + frogCoords[1] * 12].nodeID;
    
    // Manipulate MyFrog objects
    this.movieFrogs[midpoint[0] + midpoint[1] * 12].nodeID = null;
    this.movieFrogs[frogCoords[0] + frogCoords[1] * 12].nodeID = null;
    this.movieFrogs[cellCoords[0] + cellCoords[1] * 12].nodeID = frogColorNode;
}

/**
 * Movie frog eating
 */
MyGameState.prototype.movieEatFrog = function(frog, isPlayer1) {
    
    if(isPlayer1) this.movieP1Eaten.push(frog);
    else this.movieP2Eaten.push(frog);
}

/**
 * Eats a frog by pushing it into current player's eaten frogs array
 */
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
    
    // If last reply was not valid, boardString won't be a board and regex will fail
    if(boardLines == null) return [];

    for(let i = 0; i < boardLines.length; i++) {
        
       let buildLine = [];
       buildLine = boardLines[i].match(/\d+/g);
       frogletBoard.push(buildLine);
    }

    return frogletBoard;
}

/**
 * Parses Prolog AI move reply, returns move as array where [0] is X/Y srcCoords, [1] is X/Y destCoords and [2] is points
 */
MyGameState.prototype.parseAIMove = function(move) {
    
    let points = move.match(/(\d+)/g);
    let moves = move.match(/(\d+)-(\d+)/g);
    
    let srcCoords = moves[0].match(/(\d+)/g);
    let destCoords = moves[1].match(/(\d+)/g);
    
    return [[parseInt(srcCoords[1]), parseInt(srcCoords[0])], [parseInt(destCoords[1]), parseInt(destCoords[0])], [points[0]]];
}

/**
 * Parses Prolog AI first move reply, returns move as X/Y array
 */
MyGameState.prototype.parseAIFirstMove = function(move) {
    
    let moves = move.match(/(\d+)/g);
    
    return [parseInt(moves[0]), parseInt(moves[1])];
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