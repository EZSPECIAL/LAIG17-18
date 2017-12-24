var DEGREE_TO_RAD = Math.PI / 180;

/**
 * XMLscene class, representing the scene that is to be rendered.
 * @constructor
 */
function XMLscene(interface) {
	
    CGFscene.call(this);

    this.interface = interface;

    this.lightValues = {};
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
	
	//Enable transparency
	this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
	this.gl.enable(this.gl.BLEND);
	
    this.axis = new CGFaxis(this);

	//Shader variables
	this.shaderCounter = 0;
	this.shaderValue = 0;
	this.shaderColor = vec4.fromValues(1.0, 0.0, 0.0, 1.0);
	this.shaderRed = 100.0;
	this.shaderGreen = 0.0;
	this.shaderBlue = 0.0;
    this.scaleFactor = 0.3;
	
	this.previousTime = 0;
	this.updateFreq = (1.0 / 30.0) * 1000; //30 FPS
	
	//Init update cycle
	this.setUpdatePeriod(this.updateFreq);
	
    //Game state, accessible from scene graph and scene
    this.gameState = new MyGameState(this);
}

/**
 * Initializes the scene lights with the values read from the LSX file.
 */
XMLscene.prototype.initLights = function() {
	
    var i = 0;
    // Lights index.
    
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
    this.camera = new CGFcamera(0.4, 0.1, 500, vec3.fromValues(15, 15, 15), vec3.fromValues(0, 0, 0));
}

/* Handler called when the graph is finally loaded. 
 * As loading is asynchronous, this may be called already after the application has started the run loop
 */
XMLscene.prototype.onGraphLoaded = function() 
{
    this.camera.near = this.graph.near;
    this.camera.far = this.graph.far;
    this.axis = new CGFaxis(this,this.graph.referenceLength);
    
    this.setGlobalAmbientLight(this.graph.ambientIllumination[0], this.graph.ambientIllumination[1], 
    this.graph.ambientIllumination[2], this.graph.ambientIllumination[3]);
    
    this.gl.clearColor(this.graph.background[0], this.graph.background[1], this.graph.background[2], this.graph.background[3]);
    
    this.initLights();
    
    //Create picking cells grid according to board size loaded from LSX
    this.graph.pickingCells = this.createPickingCells(this.gameState.boardSize);

	//Add interface groups (lights, selected node, saturation color, scale factor, selected shader)
    this.interface.addLightsGroup(this.graph.lights);
	this.interface.addSelectableGroup(this.graph.selectableListBox);
	this.interface.addSaturationSliders();
	this.interface.addscaleFactorSlider();
	this.interface.addShaderListBox(this.graph.shadersListBox);
	
}

/**
 * Updates every scene element (animations)
 *
 * @param currTime The current system time
 */
XMLscene.prototype.update = function(currTime) {
	
	//Wait for graph load
	if(!this.graph.loadedOk) {
		
		this.previousTime = currTime;
		return;
	}
	
	//Calculate time between updates
	let deltaT = currTime - this.previousTime;

    //Update game state
    this.gameState.updateGameState();
    
	//Update shader time constant and shader uniform values when at least 65ms have passed
	this.shaderCounter += deltaT;
	
	if(this.shaderCounter >= 65) {
		
		this.shaderCounter = 0;
		
		let timeConstant = (Math.cos(this.shaderValue) + 1) / 2;
		this.shaderValue += Math.PI / 8.0;
		this.graph.shaders[this.graph.currSelectedShader].setUniformsValues({uTime: timeConstant, uColor: this.shaderColor, uScale: this.scaleFactor});
	}
	
	//Skip animation update if value is too large, would look like objects were warping
	if(deltaT > this.updateFreq + 100) {
		
		this.previousTime = currTime;
		return;
	}
	
	//Update time in animation handlers so animations and transformations matrices can be updated
	for(let i = 0; i < this.graph.animationHandlers.length; i++) {
		
		this.graph.animationHandlers[i].update(deltaT);
	}
	
	this.previousTime = currTime;
}

/**
 * Updates RGB values of saturation shader.
 */
XMLscene.prototype.updateShaderColorR = function(v) {

	this.shaderColor[0] = this.shaderRed / 100;
}

XMLscene.prototype.updateShaderColorG = function(v) {
	this.shaderColor[1] = this.shaderGreen / 100;
}

XMLscene.prototype.updateShaderColorB = function(v) {
	this.shaderColor[2] = this.shaderBlue / 100;
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
                    
					console.log("Picked object with ID: " + pickID); //TODO remove log
                    
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
    
    // Initialize Model-View matrix as identity (no transformation
    this.updateProjectionMatrix();
    this.loadIdentity();

    // Apply transformations corresponding to the camera position relative to the origin
    this.applyViewMatrix();

    this.pushMatrix();
    
    if(this.graph.loadedOk) {
		
        // Applies initial transformations.
        this.multMatrix(this.graph.initialTransforms);

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
    
    for(let z = 0; z < 12; z++) {
        for(let x = 0; x < 12; x++) {
            
            pickingCells.push(new MyPickingCell(this, vec3.fromValues(x * cellSize + padding, 0.05, z * cellSize + padding), vec3.fromValues((x + 1) * cellSize - padding, 0.05, (z + 1) * cellSize - padding)));
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