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

	this.sceneGroup.add(this.scene, 'currCamera', cameras).name('Current viewpoint');
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
 * Receives a folder name and closes it, adapted from removeFolder function from more recent DAT GUI
 */
MyInterface.prototype.closeFolder = function(name) {
    
    let folder = this.gui.__folders[name];
    if(!folder) return;

    folder.close();
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
        
        //u / U for undoing
        case 85:
        case 117: {
            
            this.scene.gameState.lastKeyPress = "u";
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