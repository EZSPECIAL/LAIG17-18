 /**
 * MyInterface class, creating a GUI interface.
 * @constructor
 */
function MyInterface() {
	
    // Call CGFinterface constructor
    CGFinterface.call(this);
};

MyInterface.prototype = Object.create(CGFinterface.prototype);
MyInterface.prototype.constructor = MyInterface;

/**
 * Initializes the interface.
 * @param {CGFapplication} application
 */
MyInterface.prototype.init = function(application) {
	
    // Call CGFinterface init
    CGFinterface.prototype.init.call(this, application);

    // Init GUI. For more information on the methods, check:
    //  http://workshop.chromeexperiments.com/examples/gui
    
    this.gui = new dat.GUI({autoplace: false, width: 320});
    
    this.gameGroup = this.gui.addFolder("New Game");
    this.sceneGroup = this.gui.addFolder("Froglet");

    this.gameGroup.open();
    this.sceneGroup.open();
    
    return true;
};

/**
 * Adds a folder containing the IDs of the lights passed as parameter
 */
MyInterface.prototype.addLightsGroup = function(lights) {

    var group = this.gui.addFolder("Lights");

	let currLight = 0;
    for (var key in lights) {
        if (lights.hasOwnProperty(key)) {
            this.scene.lightValues[key] = lights[key][0];
            group.add(this.scene.lightValues, key);
			currLight++;
        }
    }
}

/**
 * Adds GUI slider for the frog animation speed
 */
MyInterface.prototype.addFrogAnimSpeedSlider = function() {

	this.sceneGroup.add(this.scene, 'frogAnimSpeed', 5, 20).name('Frog animation speed');
}

/**
 * Adds GUI listbox containing the names of the existing viewpoints
 */
MyInterface.prototype.addCameraList = function(cameras) {

    let obj = this;

	let added = this.sceneGroup.add(this.scene, 'currCamera', cameras).name('Current viewpoint').onChange(function(v) {
		obj.scene.onCameraChange(v);
	});
    
    added.listen(); // React to changes of value without GUI input (for example when keyboard changes the value)
}

/**
 * Adds GUI slider for the camera swapping speed
 */
MyInterface.prototype.addCameraSpeedSlider = function() {

	this.sceneGroup.add(this.scene, 'cameraSpeed', 0.1, 1).name('Change camera speed');
}

/**
 * Adds GUI listbox containing the names of the existing scenes
 */
MyInterface.prototype.addSceneList = function(graphs) {

	this.sceneGroup.add(this.scene, 'currentGraph', graphs).name('Current scene');
}

/**
 * Adds GUI listbox containing the possible game modes
 */
MyInterface.prototype.addModeList = function() {
    
    let selectableModes = {"Human / Human": 0, "Human / AI": 1, "AI / Human": 2, "AI / AI": 3};

	this.gameGroup.add(this.scene, 'currentMode', selectableModes).name('Game mode');
}

/**
 * Adds GUI listbox containing the possible difficulties for both players
 */
MyInterface.prototype.addDifficultyList = function() {
    
    let selectableModes = {"Normal": "easy", "Hard": "hard"};

	this.gameGroup.add(this.scene, 'player1Diff', selectableModes).name('Player 1 difficulty');
    this.gameGroup.add(this.scene, 'player2Diff', selectableModes).name('Player 2 difficulty');
}

/**
 * Adds GUI slider for the turn time limit
 */
MyInterface.prototype.addTurnLimitSlider = function() {

	this.gameGroup.add(this.scene, 'turnTimeLimit', 10, 120).name('Turn limit (s)');
}

/**
 * Adds GUI checkbox for low resolution frogs
 */
MyInterface.prototype.addLowResCheck = function() {

	this.sceneGroup.add(this.scene, 'lowRes').name('Use cube frogs');
}

/**
 * Adds GUI checkbox for choosing whether to animate the player rotating camera
 */
MyInterface.prototype.addRotatingCamCheck = function() {

	this.sceneGroup.add(this.scene, 'animCamera').name('Rotating camera anim');
}

/**
 * Adds GUI checkbox for choosing whether to animate the frogs
 */
MyInterface.prototype.addFrogAnimCheck = function() {

	this.sceneGroup.add(this.scene, 'frogAnim').name('Frog animation');
}

/**
 * Adds GUI checkbox for choosing whether undoing moves is allowed
 */
MyInterface.prototype.addAllowUndoCheck = function() {

	this.gameGroup.add(this.scene, 'allowUndo').name('Allow undo');
}

/**
 * Adds GUI checkbox for choosing whether game is paused
 */
MyInterface.prototype.addPauseCheck = function() {

    let obj = this;

	let added = this.sceneGroup.add(this.scene, 'pauseCheckBox').name('Paused?').onChange(function(v) {
		obj.scene.onPauseChange(v);
	});
    
    added.listen(); // React to changes of value without GUI input (for example when keyboard changes the value)
}

/**
 * Receives a folder name and opens it, adapted from removeFolder function from more recent DAT GUI
 */
MyInterface.prototype.openFolder = function(name) {
    
    let folder = this.gui.__folders[name];
    if(!folder) return;

    folder.open();
}

/**
 * Receives a folder name and closes it, adapted from removeFolder function from more recent DAT GUI
 */
MyInterface.prototype.closeFolder = function(name) {
    
    let folder = this.gui.__folders[name];
    if(!folder) return;

    folder.close();
}

/**
 * Update previous controller value to sync keyboard changes to GUI
 */
MyInterface.prototype.updateController = function(folderName, controllerName, newValue) {
    
    // Look for folder
    let folder = this.gui.__folders[folderName];
    if(!folder) return;

    // Look for controller with name specified
    let i;
    let found = false;
    for(i = 0; i < folder.__controllers.length; i++) {
        
        if(folder.__controllers[i].property == controllerName) {
            found = true;
            break;
        }
    }
    
    if(!found) return;

    // Update previous value of controller
    folder.__controllers[i].__prev = newValue;
}

/**
 * Remove a folder from GUI, taken from more recent DAT GUI
 */
MyInterface.prototype.removeFolder = function(name) {
    
    let folder = this.gui.__folders[name];
    if(!folder) return;

    folder.close();
    
    this.gui.__ul.removeChild(folder.domElement.parentNode);
    delete this.gui.__folders[name];
    this.gui.onResize();
}

/**
 * Check key events
 */
MyInterface.prototype.processKeyboard = function(event) {
	
	let keyCode = event.which || event.keyCode;

    // React according to key pressed
    switch(keyCode) {
        
        //n / N for new game
        case 78:
        case 110: {
            
            this.scene.gameState.lastKeyPress = "n";
            break;
        }
        
        //p / P for pause game
        case 80:
        case 112: {
            
            this.scene.onPauseChange(!this.scene.pauseCheckBox);
            break;
        }
        
        //u / U for undoing
        case 85:
        case 117: {
            
            this.scene.gameState.lastKeyPress = "u";
            break;
        }
        
        //v / V for cycling viewpoint
        case 86:
        case 118: {
            
            // Cycle camera but not if camera is animating
            if(!this.scene.switchCameraF) this.scene.cycleViewPoint();
            break;
        }
    }
}

/**
 * Check key up event
 */
MyInterface.prototype.processKeyUp = function(event) {
	let keyCode = event.which || event.keyCode;
}

/**
 * Check key down event
 */
MyInterface.prototype.processKeyDown = function(event) {
	let keyCode = event.which || event.keyCode;
}