 /**
 * MyInterface class, creating a GUI interface.
 * @constructor
 */
function MyInterface() {
    //call CGFinterface constructor 
    CGFinterface.call(this);
}
;

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
 * Adds a folder containing RGB values of saturation shader
 */
MyInterface.prototype.addSaturationSliders = function() {
	
	let group = this.gui.addFolder("RGB Saturation");
	group.open();
	
	let obj = this;
	
	group.add(this.scene, 'shaderRed', 0, 100).onChange(function(v) {
		obj.scene.updateShaderColorR(v);
	});
	
	group.add(this.scene, 'shaderGreen', 0, 100).onChange(function(v) {
		obj.scene.updateShaderColorG(v);
	});
	
	group.add(this.scene, 'shaderBlue', 0, 100).onChange(function(v) {
		obj.scene.updateShaderColorB(v);
	});
}

/**
 * Adds a folder containing the selectable shaders.
 */
MyInterface.prototype.addShaderListBox = function(shaderList) {
	
	let group = this.gui.addFolder("Select Shader");
	group.open();
	
	group.add(this.scene.graph, 'currSelectedShader', shaderList).name('Selected Shader');
}

/**
 * Adds a folder containing the IDs of the selectable nodes passed as parameter.
 */
MyInterface.prototype.addSelectableGroup = function(selectable) {
	
	let group = this.gui.addFolder("Select Node");
	group.open();
	
	group.add(this.scene.graph, 'currSelectedNode', selectable).name('Selected Node');
}

/**
 * Adds a folder containing the IDs of the lights passed as parameter.
 */
MyInterface.prototype.addLightsGroup = function(lights) {

    var group = this.gui.addFolder("Lights");
	
    // add two check boxes to the group. The identifiers must be members variables of the scene initialized in scene.init as boolean
    // e.g. this.option1 = true; this.option2 = false;

	let currLight = 0;
	let lightNames = ["Behind house 1", "Behind house 2", "House front 1", "House front 2", "Bedside lamp"];
    for (var key in lights) {
        if (lights.hasOwnProperty(key)) {
            this.scene.lightValues[key] = lights[key][0];
            group.add(this.scene.lightValues, key).name(lightNames[currLight]);
			currLight++;
        }
    }
}