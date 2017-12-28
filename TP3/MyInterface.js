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
    
    this.gui = new dat.GUI();
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
MyInterface.prototype.addFrogAnimSpeed = function() {

	this.sceneGroup.add(this.scene, 'frogAnimSpeed', 5, 20).name('Frog speed');
}

/**
 * Adds GUI listbox containing the names of the existing viewpoints
 */
MyInterface.prototype.addCameraSelection = function(cameras) {

	this.sceneGroup.add(this.scene, 'currCamera', cameras).name('Viewpoint');
}

/**
 * Adds GUI listbox containing the names of the existing scenes
 */
MyInterface.prototype.addSceneSelection = function(graphs) {

	this.sceneGroup.add(this.scene, 'currentGraph', graphs).name('Scene');
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