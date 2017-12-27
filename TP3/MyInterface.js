 /**
 * MyInterface class, creating a GUI interface.
 * @constructor
 */
function MyInterface() {
	
    //call CGFinterface constructor
    CGFinterface.call(this);
};

MyInterface.prototype = Object.create(CGFinterface.prototype);
MyInterface.prototype.constructor = MyInterface;

/**
 * Initializes the interface.
 * @param {CGFapplication} application
 */
MyInterface.prototype.init = function(application) {
	
    // call CGFinterface init
    CGFinterface.prototype.init.call(this, application);

    // init GUI. For more information on the methods, check:
    //  http://workshop.chromeexperiments.com/examples/gui
    
    this.gui = new dat.GUI();

    // add a group of controls (and open/expand by defult)
    
    return true;
};

/**
 * Adds a folder containing the IDs of the lights passed as parameter.
 */
MyInterface.prototype.addLightsGroup = function(lights) {

    var group = this.gui.addFolder("Lights");
	
    // add two check boxes to the group. The identifiers must be members variables of the scene initialized in scene.init as boolean
    // e.g. this.option1 = true; this.option2 = false;

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
 * Adds a folder containing the frog animation speed
 */
MyInterface.prototype.addFrogAnimSpeed = function() {
	
	//let group = this.gui.addFolder("Frog animation speed");
	//group.open();
	
	let obj = this;
	
	this.gui.add(this.scene, 'frogAnimSpeed', 5, 20).name('Frog anim speed');
}

/**
 * Adds a folder containing the names of the existing cameras
 */
MyInterface.prototype.addCamerasGroup = function(cameras) {

	var group = this.gui.addFolder("Cameras");
	group.open();

	group.add(this.scene, 'currCamera', cameras).name('Selected Camera');
}

/**
 * Adds a folder containing the names of the existing scenes
 */
MyInterface.prototype.addScenesGroup = function(graphs) {

	var group = this.gui.addFolder("Scene");
	group.open();

	group.add(this.scene, 'currentGraph', graphs).name('Selected Scene');
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