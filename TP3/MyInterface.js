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
    this.sceneGroup = this.gui.addFolder("Froglet");
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

	this.sceneGroup.add(this.scene, 'frogAnimSpeed', 5, 20).name('Frog speed');
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
 * Adds GUI slider for the turn time limit
 */
MyInterface.prototype.addTurnLimitSlider = function() {

	this.sceneGroup.add(this.scene, 'turnTimeLimit', 10, 120).name('Turn limit (s)');
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
 * Remove a folder from GUI, taken from more recent version of DAT GUI
 */
MyInterface.prototype.removeFolder = function(name) {
    
    var folder = this.gui.__folders[name];
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