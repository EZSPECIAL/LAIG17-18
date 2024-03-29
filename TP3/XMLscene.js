var DEGREE_TO_RAD = Math.PI / 180;

/**
 * XMLscene class, representing the scene that is to be rendered.
 * @constructor
 */
function XMLscene(interface) {
	
    CGFscene.call(this);

    this.interface = interface;

    this.lightValues = {};
    this.selectableCameras = {};
    this.cameras = [];
    this.previousCamera = 0;
    this.currCamera = 0;
    this.cameraAngle = 0;
}

XMLscene.prototype = Object.create(CGFscene.prototype);
XMLscene.prototype.constructor = XMLscene;

/**
 * Initializes the scene, setting some WebGL defaults, initializing the camera and the axis.
 */
XMLscene.prototype.init = function(application) {
    
    CGFscene.prototype.init.call(this, application);

    this.initCameras();

    this.enableTextures(true);
    
    this.gl.clearDepth(100.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.depthFunc(this.gl.LEQUAL);
	
	// Enable transparency
	this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
	this.gl.enable(this.gl.BLEND);
	
    this.axis = new CGFaxis(this);

    // Update variables
	this.previousTime = 0;
	this.updateFreq = (1.0 / 30.0) * 1000; //30 FPS
	
	// Init update cycle
	this.setUpdatePeriod(this.updateFreq);
	
    // Flag for keeping track if at least one graph has been loaded
    this.firstLoad = true;

    // Camera animation values
    this.switchCameraF = false; // Is camera switching
    this.previousPauseValue = false;
    this.stepCamera = vec3.create();
    this.endPosition = vec3.create();
    this.nextPosition = vec3.create();
    this.endFrustum;
    this.cameraTotalDistance = 0;
    this.stepSize;
    this.cameraSpeed = 0.3; // Camera speed on UI
    this.currCameraUI = 0; // UI listbox

    // Graph switching variables for UI and program logic
    this.initGraphList();
    
    this.currentGraph = 0;
    this.lastGraph = 0;
    this.updatingGraph = false;
    
    // GUI Changeable variables
    this.frogAnimSpeed = 15; // GUI frog animation speed
    this.turnTimeLimit = 15; // Turn time (seconds) defined in GUI
    this.animCamera = true // Animate rotating camera mode
    this.frogAnim = true // Animate frog movement
    this.lowRes = false; // Use cube frogs
    this.currentMode = 0; // Current game type;
    this.player1Diff = "easy";
    this.player2Diff = "easy";
    this.allowUndo = true; // Is undoing moves past current player allowed?
    this.pauseCheckBox = false; // Is game paused
    this.alwaysAllowAI = false; // Is AI on auto play?
    
    //Game state, accessible from scene graph and scene
    this.gameState = new MyGameState(this);
    this.gameState.initGraph(this.graphs[0]);
}

/**
 * Fetches a JSON file with the names and filenames of the graph files to use
 *
 * JSON file has 2 string arrays named sceneNames and sceneFiles, sceneNames are the names
 * that will be displayed in the UI, sceneFiles are the scene files that should be loaded,
 * i.e minecraft.lsx
 */
XMLscene.prototype.initGraphList = function() {
    
    let jsonRequest = new XMLHttpRequest();

    jsonRequest.open("GET", "/scenes/scenes.json", false);
    jsonRequest.send(null);
    
    // Wait on request
    while(jsonRequest.readyState != 4){}

    // Check first digit is HTTP 2XX response
    if((''+jsonRequest.status)[0] != 2) {
        throw new Error("No \"scenes.json\" file found in ./scenes folder");
    }
    
    let myFileNames = JSON.parse(jsonRequest.response);
    
    // Add scene names to an object list
    this.selectableGraphs = {};
    for(let i = 0; i < myFileNames.sceneNames.length; i++) {
        
        this.selectableGraphs[myFileNames.sceneNames[i]] = i;
    }
    
    // Add scene file paths to an array
    this.graphs = [];
    for(let i = 0; i < myFileNames.sceneFiles.length; i++) {
        
        this.graphs.push(myFileNames.sceneFiles[i]);
    }
}

/**
 * Disable all the lights of the scene
 */ 
XMLscene.prototype.disableLights = function() {
    
    let i = 0;
    
    // Reads the lights from the scene graph.
    for(let key in this.graph.lights) {
        
        if(i >= 8) break; // Max 8 lights

        if(this.graph.lights.hasOwnProperty(key)) {

            this.lightValues[key] = false;
            i++;
        }
    }
}

/**
 * Enable all the lights of the scene
 */ 
XMLscene.prototype.enableLights = function() {
    
    let i = 0;
    
    // Reads the lights from the scene graph.
    for(let key in this.graph.lights) {
        
        if(i >= 8) break; // Max 8 lights

        if(this.graph.lights.hasOwnProperty(key)) {

            this.lightValues[key] = true;
            i++;
        }
    }
}

/**
 * Initializes the scene lights with the values read from the LSX file.
 */
XMLscene.prototype.initLights = function() {
	
    // Clear light values objects so they can be reinited
    for(let prop in this.lightValues) {
        
        if(this.lightValues.hasOwnProperty(prop))  {
            delete this.lightValues[prop];
        }
    }
    
    // Disable lights
    for(let i = 0; i < this.lights.length; i++) {
        
        this.lights[i].disable();
        this.lights[i].update();
    }
    
    var i = 0;

    // Reads the lights from the scene graph.
    for (var key in this.graph.lights) {
        if (i >= 8)
            break;              // Only eight lights allowed by WebGL.

        if (this.graph.lights.hasOwnProperty(key)) {

            var light = this.graph.lights[key];
            
            this.lights[i].setPosition(light[1][0], light[1][1], light[1][2], light[1][3]);
            this.lights[i].setAmbient(light[2][0], light[2][1], light[2][2], light[2][3]);
            this.lights[i].setDiffuse(light[3][0], light[3][1], light[3][2], light[3][3]);
            this.lights[i].setSpecular(light[4][0], light[4][1], light[4][2], light[4][3]);
            
            this.lights[i].setVisible(true);
            if (light[0])
                this.lights[i].enable();
            else
                this.lights[i].disable();
            
            this.lights[i].update();
            
            i++;
        }
    }
}

/**
 * Initializes the scene cameras.
 */
XMLscene.prototype.initCameras = function() {

    let camera = new CGFcamera(0.4, 0.1, 700, vec3.fromValues(120, 120, 120), vec3.fromValues(-25, 0, -25));
    this.cameras.push(camera);
    this.selectableCameras["Free"] = 0;
    
    let rotatingCamera = new CGFcamera(0.4, 0.1, 700, vec3.fromValues(250, 250, 250), vec3.fromValues(0, 0, 0));
    this.cameras.push(rotatingCamera);
    this.selectableCameras["Rotating"] = 1;

    let fixedCamera = new CGFcamera(0.4, 0.1, 700, vec3.fromValues(250, 250, 250), vec3.fromValues(0, 0, 0));
    this.cameras.push(fixedCamera);
    this.selectableCameras["Fixed"] = 2;


    // Camera indexes
    this.freeCameraI = Object.freeze(0);
    this.rotatingCameraI = Object.freeze(1);
    this.fixedCameraI = Object.freeze(2);
    
    this.camera = camera;
}

/**
 * Update rotating camera's position considering the current player
 */
XMLscene.prototype.updatePlayerCameraPos = function(toPlayer1) {
    
    // Decide whether to animate rotating camera and get current player index
    let animateF = (this.currCamera == this.rotatingCameraI) && (this.animCamera);
    let destinationI = toPlayer1 ? 0 : 1;
    
    // Set rotating camera position if not animating
    if(!animateF) {
        
        this.cameras[this.rotatingCameraI].setPosition(this.rotatingPositions[destinationI]);
        this.cameraAngle = 0;
        return true;
    }
    
    // Is position already correct
    let isCorrect = MyUtility.equals(this.cameras[this.rotatingCameraI].position, this.rotatingPositions[destinationI]);
    if(isCorrect) {
        
        this.cameraAngle = 0;
        return true;
    }

    // Determine direction of rotation
    let angle = toPlayer1 ? -5 : 5;
    
    this.cameraAngle += angle;

    this.cameras[this.rotatingCameraI].orbit(vec3.fromValues(0, 1, 0), DEGREE_TO_RAD * angle);
    
    // End condition, sets camera position for correcting floating point errors
    if(Math.abs(this.cameraAngle) >= 90 || this.cameraAngle == 0) {
        
        this.cameras[this.rotatingCameraI].setPosition(this.rotatingPositions[destinationI]);
        this.cameraAngle = 0;
        return true;
    }
    
    return false;
}

/**
 * Gets the possible locations of the rotating camera
 */
XMLscene.prototype.updateRotatingCameraPositions = function() {
 
    this.cameras[this.rotatingCameraI].setPosition(vec3.fromValues(2.2 * this.gameState.boardSize, 2.2 * this.gameState.boardSize, 2.2 * this.gameState.boardSize));
    this.cameras[this.rotatingCameraI].setTarget(vec3.fromValues(this.gameState.boardSize / 2, 0, this.gameState.boardSize / 2));
    this.cameras[this.rotatingCameraI].far = this.gameState.boardSize * 700 / 60;
    
    // Store rotating camera positions for both players
    this.rotatingPositions = [null, null];
    this.rotatingPositions[1] = vec3.clone(this.cameras[this.rotatingCameraI].position);

    this.cameras[this.rotatingCameraI].orbit(vec3.fromValues(0, 1, 0), DEGREE_TO_RAD * -90);
    
    this.rotatingPositions[0] = vec3.clone(this.cameras[this.rotatingCameraI].position);
    
    this.cameras[this.rotatingCameraI].orbit(vec3.fromValues(0, 1, 0), DEGREE_TO_RAD * 90);
}

/**
 * Repositions all cameras using current player and board size
 */
XMLscene.prototype.repositionCameras = function(isPlayer1) {

    this.cameras[this.rotatingCameraI].setPosition(vec3.fromValues(2.2 * this.gameState.boardSize, 2.2 * this.gameState.boardSize, 2.2 * this.gameState.boardSize));
    this.cameras[this.rotatingCameraI].setTarget(vec3.fromValues(this.gameState.boardSize / 2, 0, this.gameState.boardSize / 2));
    this.cameras[this.rotatingCameraI].far = this.gameState.boardSize * 700 / 60;

    this.cameras[this.freeCameraI].setTarget(vec3.fromValues(this.gameState.boardSize / 2, 0, this.gameState.boardSize / 2));

    this.cameras[this.fixedCameraI].setPosition(vec3.fromValues( this.gameState.boardSize / 2, 2 * this.gameState.boardSize, 4 * this.gameState.boardSize));
    this.cameras[this.fixedCameraI].setTarget(vec3.fromValues(this.gameState.boardSize / 2, this.gameState.boardSize / 6, this.gameState.boardSize));

    // Orbit 90 degrees around the board center axis to get player 1 position
    if(isPlayer1) this.cameras[this.rotatingCameraI].orbit(vec3.fromValues(0, 1, 0), DEGREE_TO_RAD * -90);
}

/**
 * On camera change callback
 */
XMLscene.prototype.onCameraChange = function(camera) {

    if(this.switchCameraF) {
        
        this.currCameraUI = this.currCamera;
        return;
    }

    // Set camera animation flag and store game pause state
    this.currCamera = camera;
    this.currCameraUI = camera;
    this.switchCameraF = true;
    this.previousPauseValue = this.gameState.isGamePaused;

    // Stop game and don't allow unpausing
    this.onPauseChange(true);
    this.gameState.allowUnpause = false;
    
    // Controls whether mouse affects camera depending on selected camera
    this.interface.setActiveCamera(null);
}

/**
 * On pause check box callback
 */
XMLscene.prototype.onPauseChange = function(newPauseBool) {

    // Update game pause if allowed
    if(this.gameState.allowUnpause) {
        
        this.interface.updateController("Froglet", "pauseCheckBox", newPauseBool);
        this.pauseCheckBox = newPauseBool;
        this.gameState.updatePause(newPauseBool, this.switchCameraF);
    // Check if unpause when not allowed to fix GUI
    } else if(!newPauseBool) {
        
        this.interface.updateController("Froglet", "pauseCheckBox", newPauseBool);
        this.pauseCheckBox = true;
    }
}

/* Handler called when the graph is finally loaded. 
 * As loading is asynchronous, this may be called already after the application has started the run loop
 */
XMLscene.prototype.onGraphLoaded = function() {
   
    // Get new rotating positions and reposition cameras
    this.updateRotatingCameraPositions();
    this.repositionCameras(this.gameState.isPlayer1);
    this.cameraAngle = 0;
    
    this.axis = new CGFaxis(this, this.graph.referenceLength);
    
    this.setGlobalAmbientLight(this.graph.ambientIllumination[0], this.graph.ambientIllumination[1], 
    this.graph.ambientIllumination[2], this.graph.ambientIllumination[3]);
    
    this.gl.clearColor(this.graph.background[0], this.graph.background[1], this.graph.background[2], this.graph.background[3]);
    
    this.initLights();

    // Create picking cells grid according to board size loaded from LSX
    this.graph.pickingCells = this.createPickingCells(this.gameState.boardSize);
    
    // After first load Froglet board is already loaded and frogs might need scaling
    if(!this.firstLoad) {
        
        // Reload lights GUI
        this.interface.removeFolder("Lights");
        this.interface.addLightsGroup(this.graph.lights);
        if(this.gameState.frogs.length > 0) this.gameState.resizeFrogs();
        
        this.updatingGraph = false;
        return; // Don't reload whole interface
    }
    
    let buttonI = 0;
    
    // Add game variables UI
    this.interface.addModeList();
    this.interface.addDifficultyList();
    this.interface.addTurnLimitSlider();
    this.interface.addAllowUndoCheck();
    
    // Add movie UI
    this.interface.addPlayMovieButton(buttonI); // Set button index to access with getElementsByClassName
    buttonI++;
    
    this.interface.addStopMovieButton(buttonI); // Set button index to access with getElementsByClassName
    buttonI++;
    
    // Update stop movie button style
    this.interface.updateControllerText("Movie", "stopMovieButton", "Stop Movie - not allowed!");
    this.gameState.buttonSetStyle(this.interface.stopMovieButtonI, "deny");
    
	// Add interface groups (lights, selected node, saturation color, scale factor, selected shader)
    this.interface.addSceneList(this.selectableGraphs);
    this.interface.addCameraList(this.selectableCameras);
    this.interface.addFrogAnimSpeedSlider();
    this.interface.addCameraSpeedSlider();
    this.interface.addRotatingCamCheck();
    this.interface.addFrogAnimCheck();
    this.interface.addLowResCheck();
    this.interface.addPauseCheck();
    this.interface.addAIMoveButton(buttonI); // Set button index to access with getElementsByClassName
    this.interface.addAlwaysAllowAICheck();
    
    // Lights UI
    this.interface.addLightsGroup(this.graph.lights);

    // Update flags that control update() and display() loop
    this.firstLoad = false;
    this.updatingGraph = false;
}

/**
 * Increments current camera up to limit
 */
XMLscene.prototype.cycleViewPoint = function() {

    let cameraValue = this.currCameraUI;
    cameraValue++;

    // Cycle camera values
    if(cameraValue > 2) cameraValue = 0;
    
    this.onCameraChange(cameraValue);
}

/**
 * Animates camera switching
 */
XMLscene.prototype.animateCamera = function(deltaT) {
    
    let startPosition = this.cameras[this.previousCamera].position;
    let totalDist;

    // Calculate position values to use during the camera animation
    if(this.stepCamera[0] == 0 && this.stepCamera[1] == 0 && this.stepCamera[2] == 0) {

        // Get current camera info
        vec3.add(this.endPosition, this.endPosition, this.cameras[this.currCamera].position);
        this.endFrustum = new Number(this.cameras[this.currCamera].far);

        // Update frustum if necessary
        if(this.cameras[this.previousCamera].far > this.cameras[this.currCamera].far) {
            this.cameras[this.currCamera].far = this.cameras[this.previousCamera].far;
        }

        // Define direction vector and step
        let direction = vec3.create();
        vec3.subtract(direction, this.endPosition, startPosition);

        this.stepSize = (40 * this.cameraSpeed) / (vec3.distance(this.endPosition, startPosition));
        vec3.scale(this.stepCamera, direction, this.stepSize);
        this.stepSize = vec3.length(this.stepCamera);

        // Set start position to the move
        vec3.add(this.nextPosition, this.nextPosition, startPosition);

    } else {

        this.camera = this.cameras[this.currCamera];
        this.cameraTotalDistance += this.stepSize;
        
        if((totalDist = vec3.distance(this.endPosition, startPosition)) <= this.cameraTotalDistance) {
            
            // Set final position and update frustum value
            this.cameras[this.currCamera].setPosition(this.endPosition);
            this.cameras[this.currCamera].far = this.endFrustum;

            // Set active camera if the new camera is the free one
            if(this.currCamera == this.freeCameraI) this.interface.setActiveCamera(this.camera);
            else this.interface.setActiveCamera(null);

            // Reset vetors and values to default
            this.cameraTotalDistance = 0;
            this.stepCamera = vec3.create();
            this.nextPosition = vec3.create();
            this.endPosition = vec3.create();

            // Reset flags
            this.gameState.allowUnpause = true;
            this.onPauseChange(this.previousPauseValue);
            this.switchCameraF = false;
            this.previousCamera = this.currCamera;

        } else {
            
            // Move camera to the next position to do the smooth change
            vec3.add(this.nextPosition, this.nextPosition, this.stepCamera);
            this.cameras[this.currCamera].setPosition(this.nextPosition);
        }
    }
}

/**
 * Check if pressed button contains "fail" or "done" for choosing highlight color
 */
XMLscene.prototype.getHighlightColor = function() {
    
    let lower = this.gameState.buttonPressed.toLowerCase();
    
    if(lower.includes("fail")) return vec4.fromValues(1.0, 0.0, 0.0, 1.0);
    if(lower.includes("done")) return vec4.fromValues(0.0, 1.0, 0.0, 1.0);
    
    // No highlight
    return vec4.fromValues(0.0, 0.0, 0.0, 1.0);
}

/**
 * Updates every scene element (animations)
 *
 * @param currTime The current system time
 */
XMLscene.prototype.update = function(currTime) {
	
    // Skip if loading new graph
    if(this.updatingGraph) return;
    
	// Wait for graph load
	if(!this.graph.loadedOk) {
		
		this.previousTime = currTime;
		return;
	}
	
	// Calculate time between updates
	let deltaT = currTime - this.previousTime;

    if(this.switchCameraF) this.animateCamera(deltaT);
    
    // Update game state
    this.gameState.updateGameState(deltaT);

    if(!this.gameState.isGamePaused) {
    
        // Update shader time constant and shader color, color is updated according to selected frog
        let timeConstant = (Math.cos(currTime / 500) + 1) / 2;
        
        // Check if wrong selection timer is active
        if(this.gameState.validTimer <= 0) {
            
            // Check if first move was valid
            if(this.gameState.validFirstMove) this.graph.frogShader.setUniformsValues({uTime: timeConstant, uColor: this.currentFrogColor()});
            else this.graph.frogShader.setUniformsValues({uTime: 0.0, uColor: vec4.fromValues(0.0, 0.0, 0.0, 1.0)});
            
        } else this.graph.frogShader.setUniformsValues({uTime: 1.0, uColor: this.invertFrogColor(this.currentFrogColor())});
     
        this.graph.highlightShader.setUniformsValues({uTime: 1.0, uColor: this.getHighlightColor()});
        if(this.gameState.state == this.gameState.stateEnum.MULTIPLE_JUMP) this.graph.jumpAgainShader.setUniformsValues({uTime: timeConstant * 0.8, uColor: vec4.fromValues(1.0, 0.3, 0.3, 1.0)});
     
        // Update time in animation handlers so animations and transformations matrices can be updated
        for(let i = 0; i < this.graph.animationHandlers.length; i++) {
        
            this.graph.animationHandlers[i].update(deltaT);
        }
        
        // Update game frogs and movie frogs
        this.updateFrogAnimations(deltaT, this.gameState.frogs);
        if(this.gameState.playingMovie) this.updateFrogAnimations(deltaT, this.gameState.movieFrogs);
    }

	this.previousTime = currTime;
    
    // Load new graph
    if(this.updatingGraph) this.gameState.initGraph(this.graphs[this.currentGraph]);
}

/**
 * Updates received frogs animations
 */
XMLscene.prototype.updateFrogAnimations = function(deltaT, frogs) {

    for(let i = 0; i < frogs.length; i++) {
            
        if(!frogs[i].animationHandler.finished) {
            frogs[i].animationHandler.update(deltaT);
        }
    }
}
 
/**
 * Choose RGB value according to frog selected
 */
XMLscene.prototype.currentFrogColor = function() {
    
    if(this.gameState.selectedFrog.length <= 0) return vec4.fromValues(1.0, 0.0, 0.0, 1.0);
    
    switch(this.gameState.frogs[this.gameState.selectedFrog[0] + this.gameState.selectedFrog[1] * 12].nodeID) {
        
        case "greenFrog": {
            
            return vec4.fromValues(0.0, 1.0, 0.0, 1.0);
            break;
        }
        
        case "yellowFrog": {
            
            return vec4.fromValues(1.0, 1.0, 0.0, 1.0);
            break;
        }
        
        case "redFrog": {
            
            return vec4.fromValues(1.0, 0.0, 0.0, 1.0);
            break;
        }
        
        case "blueFrog": {
            
            return vec4.fromValues(0.0, 0.0, 1.0, 1.0);
            break;
        }
    }
}

/**
 * Receives vec4 color and inverts it
 */
XMLscene.prototype.invertFrogColor = function(color) {
    
    let newColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    
    newColor[0] = 1 - color[0];
    newColor[1] = 1 - color[1];
    newColor[2] = 1 - color[2];
    
    return newColor
}

/**
 * Logs picked objects
 */
XMLscene.prototype.logPicking = function () {
    
	if(this.pickMode == false) {
		if(this.pickResults != null && this.pickResults.length > 0) {

			for(let i = 0; i < this.pickResults.length; i++) {
                
				let obj = this.pickResults[i][0];
				if(obj) {

					let pickID = this.pickResults[i][1];

                    //Update picked object only if previous object has been handled (0 meaning "handled") and game isn't paused
                    if(this.gameState.pickedObject == 0 && !this.gameState.isGamePaused) this.gameState.pickedObject = pickID;
                    break;
				}
			}

			this.pickResults.splice(0, this.pickResults.length);
		}
	}
}

/**
 * Displays the scene.
 */
XMLscene.prototype.display = function() {

    this.logPicking();
    this.clearPickRegistration();

    // Clear image and depth buffer everytime we update the scene
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Initialize Model-View matrix as identity (no transformation)
    this.updateProjectionMatrix();
    this.loadIdentity();

    // Apply transformations corresponding to the camera position relative to the origin
    this.applyViewMatrix();

    this.pushMatrix();
    
    if(this.graph.loadedOk && !this.updatingGraph) {

        var i = 0;
        for (var key in this.lightValues) {
            if (this.lightValues.hasOwnProperty(key)) {
                if (this.lightValues[key]) {
                    this.lights[i].setVisible(true);
                    this.lights[i].enable();
                }
                else {
                    this.lights[i].setVisible(false);
                    this.lights[i].disable();
                }
                this.lights[i].update();
                i++;
            }
        }

        // Displays the scene.
        this.graph.displayScene();
    }

    this.popMatrix();
}

/**
 * Creates a 12x12 grid of picking cells
 *
 * @param boardSize the size of the current board
 */
XMLscene.prototype.createPickingCells = function(boardSize) {
    
    let cellSize = boardSize / 12; //12x12 board
    let pickingCellSize = cellSize * 0.85; //Use a percentage of the total cell size
    let padding = (cellSize - pickingCellSize) / 2;
    
    let pickingCells = [];
    let yAdjust = 0.25 * boardSize / 120; // 0.2 Y adjust works for 120 board size, calculate needed adjust for current board size
    
    for(let z = 0; z < 12; z++) {
        for(let x = 0; x < 12; x++) {
            
            pickingCells.push(new MyPickingCell(this, vec3.fromValues(x * cellSize + padding, yAdjust, z * cellSize + padding), vec3.fromValues((x + 1) * cellSize - padding, yAdjust, (z + 1) * cellSize - padding)));
        }
    }

    return pickingCells;
}

/**
 * Sends HTTP Request to SICSTUS server and gets response
 */
XMLscene.prototype.getPrologRequest = function(requestString, onError) {
	
	let requestPort = 8081;
    let scene = this;
	let request = new XMLHttpRequest();
	request.open('GET', 'http://localhost:' + requestPort + '/' + requestString, true);

    // Store reply and activate reply flag
	request.onload = function(data) {
        
            //console.log("Server sent: " + data.target.response);
            scene.gameState.lastReply = data.target.response;
            scene.gameState.replyFlag = true;
    };
    
    // Reset game on server fail
	request.onerror = function() {
       
        //console.log("Error waiting for response");
        scene.gameState.onServerFail();
    };

	request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	request.send();
}

/**
 * Makes request to SICSTUS server
 */
XMLscene.prototype.makeRequest = function(requestString) {

	this.getPrologRequest(requestString);
}