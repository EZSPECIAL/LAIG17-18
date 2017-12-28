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

	// Frog shader color //TODO remove?
	this.shaderColor = vec4.fromValues(1.0, 0.0, 0.0, 1.0);
	
	this.previousTime = 0;
	this.updateFreq = (1.0 / 30.0) * 1000; //30 FPS
	
	// Init update cycle
	this.setUpdatePeriod(this.updateFreq);
	
    // Flag for keeping track if at least one graph has been loaded
    this.firstLoad = true;

    // Graph switching variables for UI and program logic
    this.initGraphList();
    
    this.currentGraph = 0;
    this.lastGraph = 0;
    this.updatingGraph = false;
    
    // GUI Frog animation speed
    this.frogAnimSpeed = 5;
    
    //Game state, accessible from scene graph and scene
    this.gameState = new MyGameState(this);
    this.gameState.initGraph("frogglet_classroom.lsx"); //TODO how to handle default?
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
 * Initializes the scene lights with the values read from the LSX file.
 */
XMLscene.prototype.initLights = function() {
	
    // Clear light values objects so they can be reinited
    for(let prop in this.lightValues) {
        
        if(this.lightValues.hasOwnProperty(prop))  {
            delete this.lightValues[prop];
        }
    }
    
    // Disable all the lights
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

    let camera = new CGFcamera(0.4, 0.1, 700, vec3.fromValues(15, 15, 15), vec3.fromValues(0, 0, 0));
    this.cameras.push(camera);
    this.selectableCameras["Normal Camera"] = 1;

    let fixedCamera = new CGFcamera(0.4, 0.1, 700, vec3.fromValues(15, 15, 15), vec3.fromValues(0, 0, 0));
    this.cameras.push(fixedCamera);
    this.selectableCameras["Fixed Camera"] = 0;
    this.camera = fixedCamera;

}

/**
 * Update camera's position considering the current player
 */
XMLscene.prototype.updatePlayerCameraPos = function(isPlayer1) {
    
    let angle = 5;

    if(isPlayer1) angle = -5;

    this.cameraAngle += angle;

    this.camera.orbit(vec3.fromValues(0,1,0), DEGREE_TO_RAD * angle);

    if(Math.abs(this.cameraAngle) >= 90) {
        this.cameraAngle = 0;
        return true;
    }
    
    return false;
}

/**
 * Sets camera to player viewpoint
 */
XMLscene.prototype.setPlayerCameraPos = function(isPlayer1) {

    for(let i = 0; i < this.cameras.length; i++) {

        this.cameras[i].setPosition(vec3.fromValues(2.2 * this.gameState.boardSize, 2.2 * this.gameState.boardSize, 2.2 * this.gameState.boardSize));
        this.cameras[i].setTarget(vec3.fromValues(this.gameState.boardSize / 2, 0, this.gameState.boardSize / 2));
        this.cameras[i].far = this.gameState.boardSize * 700 / 180;
        
        if(isPlayer1) {
            this.cameras[i].orbit(vec3.fromValues(0, 1, 0), DEGREE_TO_RAD * -90);
        }
    }
}

/* Handler called when the graph is finally loaded. 
 * As loading is asynchronous, this may be called already after the application has started the run loop
 */
XMLscene.prototype.onGraphLoaded = function() {
    
    // Reset updating flag
    this.updatingGraph = false;

    this.cameraAngle = 0;
    this.setPlayerCameraPos(this.gameState.isPlayer1);

    this.axis = new CGFaxis(this, this.graph.referenceLength);
    
    this.setGlobalAmbientLight(this.graph.ambientIllumination[0], this.graph.ambientIllumination[1], 
    this.graph.ambientIllumination[2], this.graph.ambientIllumination[3]);
    
    this.gl.clearColor(this.graph.background[0], this.graph.background[1], this.graph.background[2], this.graph.background[3]);
    
    this.initLights();

    // Create picking cells grid according to board size loaded from LSX
    this.graph.pickingCells = this.createPickingCells(this.gameState.boardSize);
    
    //TODO no resize?
    // After first load Froglet board is already loaded and frogs might need scaling
    if(!this.firstLoad) {
        
        // Reload lights GUI
        this.interface.removeFolder("Lights");
        this.interface.addLightsGroup(this.graph.lights);
        this.gameState.resizeFrogs();
        return; // Don't reload whole interface
    }
    
	// Add interface groups (lights, selected node, saturation color, scale factor, selected shader)
    this.interface.addCameraSelection(this.selectableCameras); //TODO change to viewpoints instead of cameras
    this.interface.addSceneSelection(this.selectableGraphs);
    this.interface.addFrogAnimSpeed();
    this.interface.addLightsGroup(this.graph.lights);
    
    this.firstLoad = false;
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

    // Update game state
    this.gameState.updateGameState(deltaT);

	// Update shader time constant and shader color, color is updated according to selected frog
	let timeConstant = (Math.cos(currTime / 500) + 1) / 2;
	this.graph.frogShader.setUniformsValues({uTime: timeConstant, uColor: this.currentFrogColor()});
 
	// Update time in animation handlers so animations and transformations matrices can be updated
	for(let i = 0; i < this.graph.animationHandlers.length; i++) {
		
		this.graph.animationHandlers[i].update(deltaT);
	}
 
    // Animate frogs
    for(let i = 0; i < this.gameState.frogs.length; i++) {
            
        if(!this.gameState.frogs[i].animationHandler.finished) {
            this.gameState.frogs[i].animationHandler.update(deltaT);
        }
    }

	this.previousTime = currTime;
    
    // Load new graph
    if(this.updatingGraph) this.gameState.initGraph(this.graphs[this.currentGraph]);
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
 * Logs picked objects
 */
XMLscene.prototype.logPicking = function () {
    
	if(this.pickMode == false) {
		if(this.pickResults != null && this.pickResults.length > 0) {

			for(let i = 0; i < this.pickResults.length; i++) {
                
				let obj = this.pickResults[i][0];
				if(obj) {

					let pickID = this.pickResults[i][1];

                    //Update picked object only if previous object has been handled (0 meaning "handled")
                    if(this.gameState.pickedObject == 0) this.gameState.pickedObject = pickID;
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
    
    this.camera = this.cameras[this.currCamera];

    // Initialize Model-View matrix as identity (no transformation
    this.updateProjectionMatrix();
    this.loadIdentity();

    // Apply transformations corresponding to the camera position relative to the origin
    this.applyViewMatrix();

    this.pushMatrix();
    
    if(this.graph.loadedOk && !this.updatingGraph) {
		
        // Applies initial transformations.
        //this.multMatrix(this.graph.initialTransforms);

		// Draw axis
		this.axis.display();

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
    } else {
		
        // Draw axis
		this.axis.display();
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

	request.onload = function(data) {
        
            console.log("Server sent: " + data.target.response); //TODO remove log
            scene.gameState.lastReply = data.target.response;
            scene.gameState.replyFlag = true;
    };
    
	request.onerror = onError || function(){console.log("Error waiting for response");};

	request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	request.send();
}

/**
 * Makes request to SICSTUS server
 */
XMLscene.prototype.makeRequest = function(requestString) {

	this.getPrologRequest(requestString);
}