var DEGREE_TO_RAD = Math.PI / 180;

// Order of the groups in the XML document.
var INITIALS_INDEX = 0;
var ILLUMINATION_INDEX = 1;
var LIGHTS_INDEX = 2;
var TEXTURES_INDEX = 3;
var MATERIALS_INDEX = 4;
var ANIMATIONS_INDEX = 5;
var NODES_INDEX = 6;

/**
 * MySceneGraph class, representing the scene graph.
 * @constructor
 */
function MySceneGraph(filename, scene) {
	
    this.loadedOk = null ;
	
    // Establish bidirectional references between scene and graph.
    this.scene = scene;
    scene.graph = this;
    
    this.nodes = [];
	this.animationHandlers = []; //Animation handler for each node
	this.selectableListBox = {}; //List of options as associative array
	this.selectableNodes = []; //List of options as regular array
	this.currSelectedNode = 0;
	
	//Set index 0 of list box as "no selection" so user can choose not to apply shaders
	this.selectableListBox["no selection"] = 0;
	this.selectableNodes.push(null);
	
	//Create shaders and shader list box
	this.shadersListBox = {"Expand": 0, "Saturate": 1, "Both": 2};
	this.shaders = [ new CGFshader(scene.gl, "shaders/expand.vert", "shaders/default.frag"),
					 new CGFshader(scene.gl, "shaders/default.vert", "shaders/saturate.frag"),
					 new CGFshader(scene.gl, "shaders/expand.vert", "shaders/saturate.frag") ];
	this.currSelectedShader = 0;
	
	this.materialStack = [];
	this.textureStack = [];

	this.rootMaterialFlag = false;
    
    this.idRoot = null;                    // The id of the root element.

    this.axisCoords = [];
    this.axisCoords['x'] = [1, 0, 0];
    this.axisCoords['y'] = [0, 1, 0];
    this.axisCoords['z'] = [0, 0, 1];

    // File reading 
    this.reader = new CGFXMLreader();
    
    /*
	 * Read the contents of the xml file, and refer to this class for loading and error handlers.
	 * After the file is read, the reader calls onXMLReady on this object.
	 * If any error occurs, the reader calls onXMLError on this object, with an error message
	 */
    
    this.reader.open('scenes/' + filename, this);
}

/*
 * Callback to be executed after successful reading
 */
MySceneGraph.prototype.onXMLReady = function() 
{
    console.log("XML Loading finished.");
    var rootElement = this.reader.xmlDoc.documentElement;
    
    // Here should go the calls for different functions to parse the various blocks
    var error = this.parseLSXFile(rootElement);
    
    if (error != null ) {
        this.onXMLError(error);
        return;
    }
    
    this.loadedOk = true;
    
    // As the graph loaded ok, signal the scene so that any additional initialization depending on the graph can take place
    this.scene.onGraphLoaded();
}

/**
 * Parses the LSX file, processing each block.
 */
MySceneGraph.prototype.parseLSXFile = function(rootElement) {
    if (rootElement.nodeName != "SCENE")
        return "root tag <SCENE> missing";
    
    var nodes = rootElement.children;
    
    // Reads the names of the nodes to an auxiliary buffer.
    var nodeNames = [];
    
    for (var i = 0; i < nodes.length; i++) {
        nodeNames.push(nodes[i].nodeName);
    }
    
    var error;
    
    // Processes each node, verifying errors.
    
    // <INITIALS>
    var index;
    if ((index = nodeNames.indexOf("INITIALS")) == -1)
        return "tag <INITIALS> missing";
    else {
        if (index != INITIALS_INDEX)
            this.onXMLMinorError("tag <INITIALS> out of order");
        
        if ((error = this.parseInitials(nodes[index])) != null )
            return error;
    }
    
    // <ILLUMINATION>
    if ((index = nodeNames.indexOf("ILLUMINATION")) == -1)
        return "tag <ILLUMINATION> missing";
    else {
        if (index != ILLUMINATION_INDEX)
            this.onXMLMinorError("tag <ILLUMINATION> out of order");
        
        if ((error = this.parseIllumination(nodes[index])) != null )
            return error;
    }
    
    // <LIGHTS>
    if ((index = nodeNames.indexOf("LIGHTS")) == -1)
        return "tag <LIGHTS> missing";
    else {
        if (index != LIGHTS_INDEX)
            this.onXMLMinorError("tag <LIGHTS> out of order");
        
        if ((error = this.parseLights(nodes[index])) != null )
            return error;
    }
    
    // <TEXTURES>
    if ((index = nodeNames.indexOf("TEXTURES")) == -1)
        return "tag <TEXTURES> missing";
    else {
        if (index != TEXTURES_INDEX)
            this.onXMLMinorError("tag <TEXTURES> out of order");
        
        if ((error = this.parseTextures(nodes[index])) != null )
            return error;
    }
    
    // <MATERIALS>
    if ((index = nodeNames.indexOf("MATERIALS")) == -1)
        return "tag <MATERIALS> missing";
    else {
        if (index != MATERIALS_INDEX)
            this.onXMLMinorError("tag <MATERIALS> out of order");
        
        if ((error = this.parseMaterials(nodes[index])) != null )
            return error;
    }
	
	// <ANIMATIONS>
    if ((index = nodeNames.indexOf("ANIMATIONS")) == -1)
        return "tag <ANIMATIONS> missing";
    else {
        if (index != ANIMATIONS_INDEX)
            this.onXMLMinorError("tag <ANIMATIONS> out of order");
        
        if ((error = this.parseAnimations(nodes[index])) != null )
            return error;
    }
    
    // <NODES>
    if ((index = nodeNames.indexOf("NODES")) == -1)
        return "tag <NODES> missing";
    else {
        if (index != NODES_INDEX)
            this.onXMLMinorError("tag <NODES> out of order");
        
        if ((error = this.parseNodes(nodes[index])) != null )
            return error;
    }

}

/**
 * Parses the <INITIALS> block.
 */
MySceneGraph.prototype.parseInitials = function(initialsNode) {
    
    var children = initialsNode.children;
    
    var nodeNames = [];
    
    for (var i = 0; i < children.length; i++)
        nodeNames.push(children[i].nodeName);
    
    // Frustum planes.
    this.near = 0.1;
    this.far = 500;
    var indexFrustum = nodeNames.indexOf("frustum");
    if (indexFrustum == -1) {
        this.onXMLMinorError("frustum planes missing; assuming 'near = 0.1' and 'far = 500'");
    } 
    else {
        this.near = this.reader.getFloat(children[indexFrustum], 'near');
        this.far = this.reader.getFloat(children[indexFrustum], 'far');
        
        if (this.near == null ) {
            this.near = 0.1;
            this.onXMLMinorError("unable to parse value for near plane; assuming 'near = 0.1'");
        }
        else if (this.far == null ) {
            this.far = 500;
            this.onXMLMinorError("unable to parse value for far plane; assuming 'far = 500'");
        }
        else if (isNaN(this.near)) {
            this.near = 0.1;
            this.onXMLMinorError("non-numeric value found for near plane; assuming 'near = 0.1'");
        }
        else if (isNaN(this.far)) {
            this.far = 500;
            this.onXMLMinorError("non-numeric value found for far plane; assuming 'far = 500'");
        }
        else if (this.near <= 0) {
            this.near = 0.1;
            this.onXMLMinorError("'near' must be positive; assuming 'near = 0.1'");
        }

        if (this.near >= this.far)
            return "'near' must be smaller than 'far'";
    }

    // Checks if at most one translation, three rotations, and one scaling are defined.
    if (initialsNode.getElementsByTagName('translation').length > 1)
        return "no more than one initial translation may be defined";
    
    if (initialsNode.getElementsByTagName('rotation').length > 3)
        return "no more than three initial rotations may be defined";

    if (initialsNode.getElementsByTagName('scale').length > 1)
        return "no more than one scaling may be defined";
    
    // Initial transforms.
    this.initialTranslate = [];
    this.initialScaling = [];
    this.initialRotations = [];
    
    // Gets indices of each element.
    var translationIndex = nodeNames.indexOf("translation");
    var thirdRotationIndex = nodeNames.indexOf("rotation");
    var secondRotationIndex = nodeNames.indexOf("rotation", thirdRotationIndex + 1);
    var firstRotationIndex = nodeNames.lastIndexOf("rotation");
    var scalingIndex = nodeNames.indexOf("scale");
    
    // Checks if the indices are valid and in the expected order.
    // Translation.
    this.initialTransforms = mat4.create();
    mat4.identity(this.initialTransforms);
    if (translationIndex == -1) 
        this.onXMLMinorError("initial translation undefined; assuming T = (0, 0, 0)");
    else {
        var tx = this.reader.getFloat(children[translationIndex], 'x');
        var ty = this.reader.getFloat(children[translationIndex], 'y');
        var tz = this.reader.getFloat(children[translationIndex], 'z');
        
        if (tx == null ) {
            tx = 0;
            this.onXMLMinorError("failed to parse x-coordinate of initial translation; assuming tx = 0");
        }
        else if (isNaN(tx)) {
            tx = 0;
            this.onXMLMinorError("found non-numeric value for x-coordinate of initial translation; assuming tx = 0");
        }
        
        if (ty == null ) {
            ty = 0;
            this.onXMLMinorError("failed to parse y-coordinate of initial translation; assuming ty = 0");
        }
        else if (isNaN(ty)) {
            ty = 0;
            this.onXMLMinorError("found non-numeric value for y-coordinate of initial translation; assuming ty = 0");
        }
        
        if (tz == null ) {
            tz = 0;
            this.onXMLMinorError("failed to parse z-coordinate of initial translation; assuming tz = 0");
        }
        else if (isNaN(tz)) {
            tz = 0;
            this.onXMLMinorError("found non-numeric value for z-coordinate of initial translation; assuming tz = 0");
        }
        
        if (translationIndex > thirdRotationIndex || translationIndex > scalingIndex)
            this.onXMLMinorError("initial translation out of order; result may not be as expected");

        mat4.translate(this.initialTransforms, this.initialTransforms, [tx, ty, tz]);
    }
    
    // Rotations.
    var initialRotations = [];
    initialRotations['x'] = 0;
    initialRotations['y'] = 0;
    initialRotations['z'] = 0;
    
    var rotationDefined = [];
    rotationDefined['x'] = false;
    rotationDefined['y'] = false;
    rotationDefined['z'] = false;
    
    var axis;
    var rotationOrder = [];
    
    // Third rotation (first rotation defined).
    if (thirdRotationIndex != -1) {
        axis = this.reader.getItem(children[thirdRotationIndex], 'axis', ['x', 'y', 'z']);
        if (axis != null ) {
            var angle = this.reader.getFloat(children[thirdRotationIndex], 'angle');
            if (angle != null && !isNaN(angle)) {
                initialRotations[axis] += angle;
                if (!rotationDefined[axis])
                    rotationOrder.push(axis);
                rotationDefined[axis] = true;
            }
            else this.onXMLMinorError("failed to parse third initial rotation 'angle'");
        }
    }
    
    // Second rotation.
    if (secondRotationIndex != -1) {
        axis = this.reader.getItem(children[secondRotationIndex], 'axis', ['x', 'y', 'z']);
        if (axis != null ) {
            var angle = this.reader.getFloat(children[secondRotationIndex], 'angle');
            if (angle != null && !isNaN(angle)) {
                initialRotations[axis] += angle;
                if (!rotationDefined[axis])
                    rotationOrder.push(axis);
                rotationDefined[axis] = true;
            }
            else this.onXMLMinorError("failed to parse second initial rotation 'angle'");
        }
    }
    
    // First rotation.
    if (firstRotationIndex != -1) {
        axis = this.reader.getItem(children[firstRotationIndex], 'axis', ['x', 'y', 'z']);
        if (axis != null ) {
            var angle = this.reader.getFloat(children[firstRotationIndex], 'angle');
            if (angle != null && !isNaN(angle)) {
                initialRotations[axis] += angle;
                if (!rotationDefined[axis])
                    rotationOrder.push(axis);
                rotationDefined[axis] = true;
            }
            else this.onXMLMinorError("failed to parse first initial rotation 'angle'");
        }
    }

    // Checks for undefined rotations.
    if (!rotationDefined['x'])
        this.onXMLMinorError("rotation along the Ox axis undefined; assuming Rx = 0");
    else if (!rotationDefined['y'])
        this.onXMLMinorError("rotation along the Oy axis undefined; assuming Ry = 0");
    else if (!rotationDefined['z'])
        this.onXMLMinorError("rotation along the Oz axis undefined; assuming Rz = 0");

    // Updates transform matrix.
    for (var i = 0; i < rotationOrder.length; i++)
        mat4.rotate(this.initialTransforms, this.initialTransforms, DEGREE_TO_RAD * initialRotations[rotationOrder[i]], this.axisCoords[rotationOrder[i]]);

    // Scaling.
    if (scalingIndex == -1)
        this.onXMLMinorError("initial scaling undefined; assuming S = (1, 1, 1)");
    else {
        var sx = this.reader.getFloat(children[scalingIndex], 'sx');
        var sy = this.reader.getFloat(children[scalingIndex], 'sy');
        var sz = this.reader.getFloat(children[scalingIndex], 'sz');
        
        if (sx == null ) {
            sx = 1;
            this.onXMLMinorError("failed to parse x parameter of initial scaling; assuming sx = 1");
        }
        else if (isNaN(sx)) {
            sx = 1;
            this.onXMLMinorError("found non-numeric value for x parameter of initial scaling; assuming sx = 1");
        }
        
        if (sy == null ) {
            sy = 1;
            this.onXMLMinorError("failed to parse y parameter of initial scaling; assuming sy = 1");
        }
        else if (isNaN(sy)) {
            sy = 1;
            this.onXMLMinorError("found non-numeric value for y parameter of initial scaling; assuming sy = 1");
        }
        
        if (sz == null ) {
            sz = 1;
            this.onXMLMinorError("failed to parse z parameter of initial scaling; assuming sz = 1");
        }
        else if (isNaN(sz)) {
            sz = 1;
            this.onXMLMinorError("found non-numeric value for z parameter of initial scaling; assuming sz = 1");
        }
        
        if (scalingIndex < firstRotationIndex)
            this.onXMLMinorError("initial scaling out of order; result may not be as expected");

        mat4.scale(this.initialTransforms, this.initialTransforms, [sx, sy, sz]);
    }
    
    // ----------
    // Reference length.
    this.referenceLength = 1;
    
    var indexReference = nodeNames.indexOf("reference");
    if (indexReference == -1)
        this.onXMLMinorError("reference length undefined; assuming 'length = 1'");
    else {
        // Reads the reference length.
        var length = this.reader.getFloat(children[indexReference], 'length');
        
        if (length != null ) {
            if (isNaN(length))
                this.onXMLMinorError("found non-numeric value for reference length; assuming 'length = 1'");
            else if (length <= 0)
                this.onXMLMinorError("reference length must be a positive value; assuming 'length = 1'");
            else
                this.referenceLength = length;
        }
        else
            this.onXMLMinorError("unable to parse reference length; assuming 'length = 1'");
    
    }
    
    console.log("Parsed initials");
    
    return null ;
}

/**
 * Parses the <ILLUMINATION> block.
 */
MySceneGraph.prototype.parseIllumination = function(illuminationNode) {
    
    // Reads the ambient and background values.
    var children = illuminationNode.children;
    var nodeNames = [];
    for (var i = 0; i < children.length; i++)
        nodeNames.push(children[i].nodeName);
    
    // Retrieves the global ambient illumination.
    this.ambientIllumination = [0, 0, 0, 1];
    var ambientIndex = nodeNames.indexOf("ambient");
    if (ambientIndex != -1) {
        // R.
        var r = this.reader.getFloat(children[ambientIndex], 'r');
        if (r != null ) {
            if (isNaN(r))
                return "ambient 'r' is a non numeric value on the ILLUMINATION block";
            else if (r < 0 || r > 1)
                return "ambient 'r' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.ambientIllumination[0] = r;
        }
        else
            this.onXMLMinorError("unable to parse R component of the ambient illumination; assuming R = 0");
        
        // G.
        var g = this.reader.getFloat(children[ambientIndex], 'g');
        if (g != null ) {
            if (isNaN(g))
                return "ambient 'g' is a non numeric value on the ILLUMINATION block";
            else if (g < 0 || g > 1)
                return "ambient 'g' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.ambientIllumination[1] = g;
        }
        else
            this.onXMLMinorError("unable to parse G component of the ambient illumination; assuming G = 0");
        
        // B.
        var b = this.reader.getFloat(children[ambientIndex], 'b');
        if (b != null ) {
            if (isNaN(b))
                return "ambient 'b' is a non numeric value on the ILLUMINATION block";
            else if (b < 0 || b > 1)
                return "ambient 'b' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.ambientIllumination[2] = b;
        }
        else
            this.onXMLMinorError("unable to parse B component of the ambient illumination; assuming B = 0");
        
        // A.
        var a = this.reader.getFloat(children[ambientIndex], 'a');
        if (a != null ) {
            if (isNaN(a))
                return "ambient 'a' is a non numeric value on the ILLUMINATION block";
            else if (a < 0 || a > 1)
                return "ambient 'a' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.ambientIllumination[3] = a;
        }
        else
            this.onXMLMinorError("unable to parse A component of the ambient illumination; assuming A = 1");
    } 
    else
        this.onXMLMinorError("global ambient illumination undefined; assuming Ia = (0, 0, 0, 1)");
    
    // Retrieves the background clear color.
    this.background = [0, 0, 0, 1];
    var backgroundIndex = nodeNames.indexOf("background");
    if (backgroundIndex != -1) {
        // R.
        var r = this.reader.getFloat(children[backgroundIndex], 'r');
        if (r != null ) {
            if (isNaN(r))
                return "background 'r' is a non numeric value on the ILLUMINATION block";
            else if (r < 0 || r > 1)
                return "background 'r' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.background[0] = r;
        }
        else
            this.onXMLMinorError("unable to parse R component of the background colour; assuming R = 0");
        
        // G.
        var g = this.reader.getFloat(children[backgroundIndex], 'g');
        if (g != null ) {
            if (isNaN(g))
                return "background 'g' is a non numeric value on the ILLUMINATION block";
            else if (g < 0 || g > 1)
                return "background 'g' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.background[1] = g;
        }
        else
            this.onXMLMinorError("unable to parse G component of the background colour; assuming G = 0");
        
        // B.
        var b = this.reader.getFloat(children[backgroundIndex], 'b');
        if (b != null ) {
            if (isNaN(b))
                return "background 'b' is a non numeric value on the ILLUMINATION block";
            else if (b < 0 || b > 1)
                return "background 'b' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.background[2] = b;
        }
        else
            this.onXMLMinorError("unable to parse B component of the background colour; assuming B = 0");
        
        // A.
        var a = this.reader.getFloat(children[backgroundIndex], 'a');
        if (a != null ) {
            if (isNaN(a))
                return "background 'a' is a non numeric value on the ILLUMINATION block";
            else if (a < 0 || a > 1)
                return "background 'a' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.background[3] = a;
        }
        else
            this.onXMLMinorError("unable to parse A component of the background colour; assuming A = 1");
    } 
    else
        this.onXMLMinorError("background clear colour undefined; assuming (R, G, B, A) = (0, 0, 0, 1)");
    
   console.log("Parsed illumination");
    
    return null ;
}

/**
 * Parses the <LIGHTS> node.
 */
MySceneGraph.prototype.parseLights = function(lightsNode) {
    
    var children = lightsNode.children;
    
    this.lights = [];
    var numLights = 0;
    
    var grandChildren = [];
    var nodeNames = [];
    
    // Any number of lights.
    for (var i = 0; i < children.length; i++) {
        
        if (children[i].nodeName != "LIGHT") {
            this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
            continue;
        }
        
        // Get id of the current light.
        var lightId = this.reader.getString(children[i], 'id');
        if (lightId == null )
            return "no ID defined for light";
        
        // Checks for repeated IDs.
        if (this.lights[lightId] != null )
            return "ID must be unique for each light (conflict: ID = " + lightId + ")";
        
        grandChildren = children[i].children;
        // Specifications for the current light.
        
        nodeNames = [];
        for (var j = 0; j < grandChildren.length; j++) {
            console.log(grandChildren[j].nodeName);
            nodeNames.push(grandChildren[j].nodeName);
        }
        
        // Gets indices of each element.
        var enableIndex = nodeNames.indexOf("enable");
        var positionIndex = nodeNames.indexOf("position");
        var ambientIndex = nodeNames.indexOf("ambient");
        var diffuseIndex = nodeNames.indexOf("diffuse");
        var specularIndex = nodeNames.indexOf("specular");
        
        // Light enable/disable
        var enableLight = true;
        if (enableIndex == -1) {
            this.onXMLMinorError("enable value missing for ID = " + lightId + "; assuming 'value = 1'");
        } 
        else {
            var aux = this.reader.getFloat(grandChildren[enableIndex], 'value');
            if (aux == null ) {
                this.onXMLMinorError("unable to parse value component of the 'enable light' field for ID = " + lightId + "; assuming 'value = 1'");
            } 
            else if (isNaN(aux))
                return "'enable value' is a non numeric value on the LIGHTS block";
            else if (aux != 0 &&     aux != 1)
                return "'enable value' must be 0 or 1 on the LIGHTS block"
            else
                enableLight = aux == 0 ? false : true;
        }
        
        // Retrieves the light position.
        var positionLight = [];
        if (positionIndex != -1) {
            // x
            var x = this.reader.getFloat(grandChildren[positionIndex], 'x');
            if (x != null ) {
                if (isNaN(x))
                    return "'x' is a non numeric value on the LIGHTS block";
                else
                    positionLight.push(x);
            }
            else
                return "unable to parse x-coordinate of the light position for ID = " + lightId;
            
            // y
            var y = this.reader.getFloat(grandChildren[positionIndex], 'y');
            if (y != null ) {
                if (isNaN(y))
                    return "'y' is a non numeric value on the LIGHTS block";
                else
                    positionLight.push(y);
            }
            else
                return "unable to parse y-coordinate of the light position for ID = " + lightId;
            
            // z
            var z = this.reader.getFloat(grandChildren[positionIndex], 'z');
            if (z != null ) {
                if (isNaN(z))
                    return "'z' is a non numeric value on the LIGHTS block";
                else
                    positionLight.push(z);
            }
            else
                return "unable to parse z-coordinate of the light position for ID = " + lightId;
            
            // w
            var w = this.reader.getFloat(grandChildren[positionIndex], 'w');
            if (w != null ) {
                if (isNaN(w))
                    return "'w' is a non numeric value on the LIGHTS block";
                else if (w < 0 || w > 1)
                    return "'w' must be a value between 0 and 1 on the LIGHTS block"
                else
                    positionLight.push(w);
            }
            else
                return "unable to parse w-coordinate of the light position for ID = " + lightId;
        } 
        else
            return "light position undefined for ID = " + lightId;
        
        // Retrieves the ambient component.
        var ambientIllumination = [];
        if (ambientIndex != -1) {
            // R
            var r = this.reader.getFloat(grandChildren[ambientIndex], 'r');
            if (r != null ) {
                if (isNaN(r))
                    return "ambient 'r' is a non numeric value on the LIGHTS block";
                else if (r < 0 || r > 1)
                    return "ambient 'r' must be a value between 0 and 1 on the LIGHTS block"
                else
                    ambientIllumination.push(r);
            }
            else
                return "unable to parse R component of the ambient illumination for ID = " + lightId;
            
            // G
            var g = this.reader.getFloat(grandChildren[ambientIndex], 'g');
            if (g != null ) {
                if (isNaN(g))
                    return "ambient 'g' is a non numeric value on the LIGHTS block";
                else if (g < 0 || g > 1)
                    return "ambient 'g' must be a value between 0 and 1 on the LIGHTS block"
                else
                    ambientIllumination.push(g);
            }
            else
                return "unable to parse G component of the ambient illumination for ID = " + lightId;
            
            // B
            var b = this.reader.getFloat(grandChildren[ambientIndex], 'b');
            if (b != null ) {
                if (isNaN(b))
                    return "ambient 'b' is a non numeric value on the LIGHTS block";
                else if (b < 0 || b > 1)
                    return "ambient 'b' must be a value between 0 and 1 on the LIGHTS block"
                else
                    ambientIllumination.push(b);
            }
            else
                return "unable to parse B component of the ambient illumination for ID = " + lightId;
            
            // A
            var a = this.reader.getFloat(grandChildren[ambientIndex], 'a');
            if (a != null ) {
                if (isNaN(a))
                    return "ambient 'a' is a non numeric value on the LIGHTS block";
                else if (a < 0 || a > 1)
                    return "ambient 'a' must be a value between 0 and 1 on the LIGHTS block"
                ambientIllumination.push(a);
            }
            else
                return "unable to parse A component of the ambient illumination for ID = " + lightId;
        } 
        else
            return "ambient component undefined for ID = " + lightId;
        
        // Retrieves the diffuse component
        var diffuseIllumination = [];
        if (diffuseIndex != -1) {
            // R
            var r = this.reader.getFloat(grandChildren[diffuseIndex], 'r');
            if (r != null ) {
                if (isNaN(r))
                    return "diffuse 'r' is a non numeric value on the LIGHTS block";
                else if (r < 0 || r > 1)
                    return "diffuse 'r' must be a value between 0 and 1 on the LIGHTS block"
                else
                    diffuseIllumination.push(r);
            }
            else
                return "unable to parse R component of the diffuse illumination for ID = " + lightId;
            
            // G
            var g = this.reader.getFloat(grandChildren[diffuseIndex], 'g');
            if (g != null ) {
                if (isNaN(g))
                    return "diffuse 'g' is a non numeric value on the LIGHTS block";
                else if (g < 0 || g > 1)
                    return "diffuse 'g' must be a value between 0 and 1 on the LIGHTS block"
                else
                    diffuseIllumination.push(g);
            }
            else
                return "unable to parse G component of the diffuse illumination for ID = " + lightId;
            
            // B
            var b = this.reader.getFloat(grandChildren[diffuseIndex], 'b');
            if (b != null ) {
                if (isNaN(b))
                    return "diffuse 'b' is a non numeric value on the LIGHTS block";
                else if (b < 0 || b > 1)
                    return "diffuse 'b' must be a value between 0 and 1 on the LIGHTS block"
                else
                    diffuseIllumination.push(b);
            }
            else
                return "unable to parse B component of the diffuse illumination for ID = " + lightId;
            
            // A
            var a = this.reader.getFloat(grandChildren[diffuseIndex], 'a');
            if (a != null ) {
                if (isNaN(a))
                    return "diffuse 'a' is a non numeric value on the LIGHTS block";
                else if (a < 0 || a > 1)
                    return "diffuse 'a' must be a value between 0 and 1 on the LIGHTS block"
                else
                    diffuseIllumination.push(a);
            }
            else
                return "unable to parse A component of the diffuse illumination for ID = " + lightId;
        } 
        else
            return "diffuse component undefined for ID = " + lightId;
        
        // Retrieves the specular component
        var specularIllumination = [];
        if (specularIndex != -1) {
            // R
            var r = this.reader.getFloat(grandChildren[specularIndex], 'r');
            if (r != null ) {
                if (isNaN(r))
                    return "specular 'r' is a non numeric value on the LIGHTS block";
                else if (r < 0 || r > 1)
                    return "specular 'r' must be a value between 0 and 1 on the LIGHTS block"
                else
                    specularIllumination.push(r);
            }
            else
                return "unable to parse R component of the specular illumination for ID = " + lightId;
            
            // G
            var g = this.reader.getFloat(grandChildren[specularIndex], 'g');
            if (g != null ) {
                if (isNaN(g))
                    return "specular 'g' is a non numeric value on the LIGHTS block";
                else if (g < 0 || g > 1)
                    return "specular 'g' must be a value between 0 and 1 on the LIGHTS block"
                else
                    specularIllumination.push(g);
            }
            else
                return "unable to parse G component of the specular illumination for ID = " + lightId;
            
            // B
            var b = this.reader.getFloat(grandChildren[specularIndex], 'b');
            if (b != null ) {
                if (isNaN(b))
                    return "specular 'b' is a non numeric value on the LIGHTS block";
                else if (b < 0 || b > 1)
                    return "specular 'b' must be a value between 0 and 1 on the LIGHTS block"
                else
                    specularIllumination.push(b);
            }
            else
                return "unable to parse B component of the specular illumination for ID = " + lightId;
            
            // A
            var a = this.reader.getFloat(grandChildren[specularIndex], 'a');
            if (a != null ) {
                if (isNaN(a))
                    return "specular 'a' is a non numeric value on the LIGHTS block";
                else if (a < 0 || a > 1)
                    return "specular 'a' must be a value between 0 and 1 on the LIGHTS block"
                else
                    specularIllumination.push(a);
            }
            else
                return "unable to parse A component of the specular illumination for ID = " + lightId;
        } 
        else
            return "specular component undefined for ID = " + lightId;
        
        // Light global information.
        this.lights[lightId] = [enableLight, positionLight, ambientIllumination, diffuseIllumination, specularIllumination];
        numLights++;
    }
    
    if (numLights == 0)
        return "at least one light must be defined";
    else if (numLights > 8)
        this.onXMLMinorError("too many lights defined; WebGL imposes a limit of 8 lights");
    
    console.log("Parsed lights");
    
    return null ;
}

/**
 * Parses the <TEXTURES> block.
 */
MySceneGraph.prototype.parseTextures = function(texturesNode) {
    
    this.textures = [];
    
    var eachTexture = texturesNode.children;
    // Each texture.
    
    var oneTextureDefined = false;

    for (var i = 0; i < eachTexture.length; i++) {
        var nodeName = eachTexture[i].nodeName;
        if (nodeName == "TEXTURE") {
            // Retrieves texture ID.
            var textureID = this.reader.getString(eachTexture[i], 'id');
            if (textureID == null )
                return "failed to parse texture ID";
            // Checks if ID is valid.
            if (this.textures[textureID] != null )
                return "texture ID must unique (conflict with ID = " + textureID + ")";
            
            var texSpecs = eachTexture[i].children;
            var filepath = null ;
            var amplifFactorS = null ;
            var amplifFactorT = null ;
            // Retrieves texture specifications.
            for (var j = 0; j < texSpecs.length; j++) {
                var name = texSpecs[j].nodeName;
                if (name == "file") {
                    if (filepath != null )
                        return "duplicate file paths in texture with ID = " + textureID;
                    
                    filepath = this.reader.getString(texSpecs[j], 'path');
                    if (filepath == null )
                        return "unable to parse texture file path for ID = " + textureID;
                } 
                else if (name == "amplif_factor") {
                    if (amplifFactorS != null  || amplifFactorT != null )
                        return "duplicate amplification factors in texture with ID = " + textureID;
                    
                    amplifFactorS = this.reader.getFloat(texSpecs[j], 's');
                    amplifFactorT = this.reader.getFloat(texSpecs[j], 't');
                    
                    if (amplifFactorS == null  || amplifFactorT == null )
                        return "unable to parse texture amplification factors for ID = " + textureID;
                    else if (isNaN(amplifFactorS))
                        return "'amplifFactorS' is a non numeric value";
                    else if (isNaN(amplifFactorT))
                        return "'amplifFactorT' is a non numeric value";
                    else if (amplifFactorS <= 0 || amplifFactorT <= 0)
                        return "value for amplifFactor must be positive";
                } 
                else
                    this.onXMLMinorError("unknown tag name <" + name + ">");
            }
            
            if (filepath == null )
                return "file path undefined for texture with ID = " + textureID;
            else if (amplifFactorS == null )
                return "s amplification factor undefined for texture with ID = " + textureID;
            else if (amplifFactorT == null )
                return "t amplification factor undefined for texture with ID = " + textureID;
            
            var texture = new CGFtexture(this.scene,"./scenes/" + filepath);
            
            this.textures[textureID] = [texture, amplifFactorS, amplifFactorT];
            oneTextureDefined = true;
        } 
        else
            this.onXMLMinorError("unknown tag name <" + nodeName + ">");
    }

    if (!oneTextureDefined)
        return "at least one texture must be defined in the TEXTURES block";
    
    console.log("Parsed textures");
}

/**
 * Parses the <MATERIALS> node.
 */
MySceneGraph.prototype.parseMaterials = function(materialsNode) {
    
    var children = materialsNode.children;
    // Each material.
    
    this.materials = [];

    var oneMaterialDefined = false;
    
    for (var i = 0; i < children.length; i++) {
        if (children[i].nodeName != "MATERIAL") {
            this.onXMLMinorError("unknown tag name <" + children[i].nodeName + ">");
            continue;
        }
        
        var materialID = this.reader.getString(children[i], 'id');
        if (materialID == null )
            return "no ID defined for material";
        
        if (this.materials[materialID] != null )
            return "ID must be unique for each material (conflict: ID = " + materialID + ")";
        
        var materialSpecs = children[i].children;
        
        var nodeNames = [];
        
        for (var j = 0; j < materialSpecs.length; j++)
            nodeNames.push(materialSpecs[j].nodeName);
        
        // Determines the values for each field.
        // Shininess.
        var shininessIndex = nodeNames.indexOf("shininess");
        if (shininessIndex == -1)
            return "no shininess value defined for material with ID = " + materialID;
        var shininess = this.reader.getFloat(materialSpecs[shininessIndex], 'value');
        if (shininess == null )
            return "unable to parse shininess value for material with ID = " + materialID;
        else if (isNaN(shininess))
            return "'shininess' is a non numeric value";
        else if (shininess <= 0)
            return "'shininess' must be positive";
        
        // Specular component.
        var specularIndex = nodeNames.indexOf("specular");
        if (specularIndex == -1)
            return "no specular component defined for material with ID = " + materialID;
        var specularComponent = [];
        // R.
        var r = this.reader.getFloat(materialSpecs[specularIndex], 'r');
        if (r == null ) 
            return "unable to parse R component of specular reflection for material with ID = " + materialID;
        else if (isNaN(r))
            return "specular 'r' is a non numeric value on the MATERIALS block";
        else if (r < 0 || r > 1)
            return "specular 'r' must be a value between 0 and 1 on the MATERIALS block"
        specularComponent.push(r);
        // G.
        var g = this.reader.getFloat(materialSpecs[specularIndex], 'g');
        if (g == null )
           return "unable to parse G component of specular reflection for material with ID = " + materialID;
        else if (isNaN(g))
           return "specular 'g' is a non numeric value on the MATERIALS block";
        else if (g < 0 || g > 1)
           return "specular 'g' must be a value between 0 and 1 on the MATERIALS block";
        specularComponent.push(g);
        // B.
        var b = this.reader.getFloat(materialSpecs[specularIndex], 'b');
        if (b == null )
            return "unable to parse B component of specular reflection for material with ID = " + materialID;
        else if (isNaN(b))
            return "specular 'b' is a non numeric value on the MATERIALS block";
        else if (b < 0 || b > 1)
            return "specular 'b' must be a value between 0 and 1 on the MATERIALS block";
        specularComponent.push(b);
        // A.
        var a = this.reader.getFloat(materialSpecs[specularIndex], 'a');
        if (a == null )
            return "unable to parse A component of specular reflection for material with ID = " + materialID;
        else if (isNaN(a))
            return "specular 'a' is a non numeric value on the MATERIALS block";
        else if (a < 0 || a > 1)
            return "specular 'a' must be a value between 0 and 1 on the MATERIALS block";
        specularComponent.push(a);
        
        // Diffuse component.
        var diffuseIndex = nodeNames.indexOf("diffuse");
        if (diffuseIndex == -1)
            return "no diffuse component defined for material with ID = " + materialID;
        var diffuseComponent = [];
        // R.
        r = this.reader.getFloat(materialSpecs[diffuseIndex], 'r');
        if (r == null )
            return "unable to parse R component of diffuse reflection for material with ID = " + materialID;
        else if (isNaN(r))
            return "diffuse 'r' is a non numeric value on the MATERIALS block";
        else if (r < 0 || r > 1)
            return "diffuse 'r' must be a value between 0 and 1 on the MATERIALS block";
        diffuseComponent.push(r);
        // G.
        g = this.reader.getFloat(materialSpecs[diffuseIndex], 'g');
        if (g == null )
            return "unable to parse G component of diffuse reflection for material with ID = " + materialID;
        else if (isNaN(g))
            return "diffuse 'g' is a non numeric value on the MATERIALS block";
        else if (g < 0 || g > 1)
            return "diffuse 'g' must be a value between 0 and 1 on the MATERIALS block";
        diffuseComponent.push(g);
        // B.
        b = this.reader.getFloat(materialSpecs[diffuseIndex], 'b');
        if (b == null )
            return "unable to parse B component of diffuse reflection for material with ID = " + materialID;
        else if (isNaN(b))
            return "diffuse 'b' is a non numeric value on the MATERIALS block";
        else if (b < 0 || b > 1)
            return "diffuse 'b' must be a value between 0 and 1 on the MATERIALS block";
        diffuseComponent.push(b);
        // A.
        a = this.reader.getFloat(materialSpecs[diffuseIndex], 'a');
        if (a == null )
            return "unable to parse A component of diffuse reflection for material with ID = " + materialID;
        else if (isNaN(a))
            return "diffuse 'a' is a non numeric value on the MATERIALS block";
        else if (a < 0 || a > 1)
            return "diffuse 'a' must be a value between 0 and 1 on the MATERIALS block";
        diffuseComponent.push(a);
        
        // Ambient component.
        var ambientIndex = nodeNames.indexOf("ambient");
        if (ambientIndex == -1)
            return "no ambient component defined for material with ID = " + materialID;
        var ambientComponent = [];
        // R.
        r = this.reader.getFloat(materialSpecs[ambientIndex], 'r');
        if (r == null )
            return "unable to parse R component of ambient reflection for material with ID = " + materialID;
        else if (isNaN(r))
            return "ambient 'r' is a non numeric value on the MATERIALS block";
        else if (r < 0 || r > 1)
            return "ambient 'r' must be a value between 0 and 1 on the MATERIALS block";
        ambientComponent.push(r);
        // G.
        g = this.reader.getFloat(materialSpecs[ambientIndex], 'g');
        if (g == null )
            return "unable to parse G component of ambient reflection for material with ID = " + materialID;
        else if (isNaN(g))
            return "ambient 'g' is a non numeric value on the MATERIALS block";
        else if (g < 0 || g > 1)
            return "ambient 'g' must be a value between 0 and 1 on the MATERIALS block";
        ambientComponent.push(g);
        // B.
        b = this.reader.getFloat(materialSpecs[ambientIndex], 'b');
        if (b == null )
             return "unable to parse B component of ambient reflection for material with ID = " + materialID;
        else if (isNaN(b))
             return "ambient 'b' is a non numeric value on the MATERIALS block";
        else if (b < 0 || b > 1)
             return "ambient 'b' must be a value between 0 and 1 on the MATERIALS block";
        ambientComponent.push(b);
        // A.
        a = this.reader.getFloat(materialSpecs[ambientIndex], 'a');
        if (a == null )
            return "unable to parse A component of ambient reflection for material with ID = " + materialID;
        else if (isNaN(a))
            return "ambient 'a' is a non numeric value on the MATERIALS block";
        else if (a < 0 || a > 1)
            return "ambient 'a' must be a value between 0 and 1 on the MATERIALS block";
        ambientComponent.push(a);
        
        // Emission component.
        var emissionIndex = nodeNames.indexOf("emission");
        if (emissionIndex == -1)
            return "no emission component defined for material with ID = " + materialID;
        var emissionComponent = [];
        // R.
        r = this.reader.getFloat(materialSpecs[emissionIndex], 'r');
        if (r == null )
            return "unable to parse R component of emission for material with ID = " + materialID;
        else if (isNaN(r))
            return "emisson 'r' is a non numeric value on the MATERIALS block";
        else if (r < 0 || r > 1)
            return "emisson 'r' must be a value between 0 and 1 on the MATERIALS block";
        emissionComponent.push(r);
        // G.
        g = this.reader.getFloat(materialSpecs[emissionIndex], 'g');
        if (g == null )
            return "unable to parse G component of emission for material with ID = " + materialID;
        if (isNaN(g))
            return "emisson 'g' is a non numeric value on the MATERIALS block";
        else if (g < 0 || g > 1)
            return "emisson 'g' must be a value between 0 and 1 on the MATERIALS block";
        emissionComponent.push(g);
        // B.
        b = this.reader.getFloat(materialSpecs[emissionIndex], 'b');
        if (b == null )
            return "unable to parse B component of emission for material with ID = " + materialID;
        else if (isNaN(b))
            return "emisson 'b' is a non numeric value on the MATERIALS block";
        else if (b < 0 || b > 1)
            return "emisson 'b' must be a value between 0 and 1 on the MATERIALS block";
        emissionComponent.push(b);
        // A.
        a = this.reader.getFloat(materialSpecs[emissionIndex], 'a');
        if (a == null )
            return "unable to parse A component of emission for material with ID = " + materialID;
        else if (isNaN(a))
            return "emisson 'a' is a non numeric value on the MATERIALS block";
        else if (a < 0 || a > 1)
            return "emisson 'a' must be a value between 0 and 1 on the MATERIALS block";
        emissionComponent.push(a);
        
        // Creates material with the specified characteristics.
        var newMaterial = new CGFappearance(this.scene);
        newMaterial.setShininess(shininess);
        newMaterial.setAmbient(ambientComponent[0], ambientComponent[1], ambientComponent[2], ambientComponent[3]);
        newMaterial.setDiffuse(diffuseComponent[0], diffuseComponent[1], diffuseComponent[2], diffuseComponent[3]);
        newMaterial.setSpecular(specularComponent[0], specularComponent[1], specularComponent[2], specularComponent[3]);
        newMaterial.setEmission(emissionComponent[0], emissionComponent[1], emissionComponent[2], emissionComponent[3]);
        this.materials[materialID] = newMaterial;
        oneMaterialDefined = true;
    }

    if (!oneMaterialDefined)
        return "at least one material must be defined on the MATERIALS block";

    // Generates a default material.
    this.generateDefaultMaterial();
    
    console.log("Parsed materials");
}

/**
 * Parses the <ANIMATIONS> block.
 */
MySceneGraph.prototype.parseAnimations = function(animationsNode) {
    
    this.animations = [];
	
	let animationNodes = animationsNode.children; //Get all the ANIMATION blocks separately
	
	for(let i = 0; i < animationNodes.length; i++) {
		
		let nodeName = animationNodes[i].nodeName;
		
		let attributeLength = animationNodes[i].attributes.length;
		
		//Check tag equals <ANIMATION>
		if(nodeName != "ANIMATION") {
			this.onXMLMinorError("unknown tag name <" + nodeName + ">");
			continue;
		}
		
		//Parse animation ID attribute
		let animationID = this.reader.getString(animationNodes[i], 'id');
		
		if(animationID == null) return "unable to parse animation ID";
		animationID = animationID.trim();
		
		if(this.animations[animationID] != null) return "animation ID must be unique (conflict with ID = " + animationID + ")";
		
		//Parse animation type attribute
		let animationType = this.reader.getString(animationNodes[i], 'type');
		
		if(animationType == null) return "unable to parse animation type for animation with ID = " + animationID;
		animationType = animationType.trim();
		animationType = animationType.toLowerCase();
		
		let validTypes = ["linear", "circular", "bezier", "combo"]; //Check animation type is valid
		if(validTypes.indexOf(animationType) == -1) return "not a valid animation type for animation with ID = " + animationID;

		//Parse animation speed attribute
		let animationSpeed = 0;
		
		if(animationType != "combo") {
			
			animationSpeed = this.reader.getFloat(animationNodes[i], 'speed');

			if(animationSpeed == null) return "unable to parse animation speed for animation with ID = " + animationID;
			else if(isNaN(animationSpeed)) return "animation speed is a non numeric value for animation with ID = " + animationID;
			else if(animationSpeed <= 0) return "animation speed can't be 0 or negative for animation with ID = " + animationID;
		}
		
		//Parse and construct different MyAnimation objects
		switch(animationType) {
			
			case "linear":
			
				//Parse control points
				let linearCPElem = animationNodes[i].children;
				if(linearCPElem.length < 2) return "at least 2 control points must be defined for linear animation with ID = " + animationID;

				let linearControlPoints = [];
				let lincpX, lincpY, lincpZ;
				
				//Parse coordinates for each control point and validate them
				for(let i = 0; i < linearCPElem.length; i++) {
					
					lincpX = this.reader.getFloat(linearCPElem[i], 'xx');
					lincpY = this.reader.getFloat(linearCPElem[i], 'yy');
					lincpZ = this.reader.getFloat(linearCPElem[i], 'zz');
					
					let linearCP = [];
					linearCP.push(lincpX, lincpY, lincpZ);
					
					//Checks control point array for null or NaN
					if(MyUtility.checkNull(linearCP)) return "unable to parse control point #" + (i + 1) + " for animation with ID = " + animationID;
					else if(MyUtility.checkNaN(linearCP)) return "control point #" + (i + 1) + " has non numeric value(s) for animation with ID = " + animationID;
					
					linearControlPoints.push(vec3.fromValues(lincpX, lincpY, lincpZ));
				}
				
				let linearAnimation = new MyLinearAnimation(animationID, animationSpeed, linearControlPoints);
				this.animations[animationID] = linearAnimation;
			break;
			
			case "circular":
			
				//Parse center
				let centerX = this.reader.getFloat(animationNodes[i], 'centerx');
				let centerY = this.reader.getFloat(animationNodes[i], 'centery');
				let centerZ = this.reader.getFloat(animationNodes[i], 'centerz');
				
				let center = [];
				center.push(centerX, centerY, centerZ);
				
				if(MyUtility.checkNull(center)) return "unable to parse center for animation with ID = " + animationID;
				else if(MyUtility.checkNaN(center)) return "center has non numeric value(s) for animation with ID = " + animationID;
			
				//Parse radius
				let radius = this.reader.getFloat(animationNodes[i], 'radius');
				
				if(radius == null) return "unable to parse radius for animation with ID = " + animationID;
				else if(isNaN(radius)) return "radius is a non numeric value for animation with ID = " + animationID;
				else if(radius <= 0) return "radius can't be 0 or negative for animation with ID = " + animationID;
				
				//Parse starting angle
				let initAngle = this.reader.getFloat(animationNodes[i], 'startang');
				
				if(initAngle == null) return "unable to parse starting angle for animation with ID = " + animationID;
				else if(isNaN(initAngle)) return "starting angle is a non numeric value for animation with ID = " + animationID;
				
				//Parse rotation angle
				let rotationAngle = this.reader.getFloat(animationNodes[i], 'rotang');
				
				if(rotationAngle == null) return "unable to parse rotation angle for animation with ID = " + animationID;
				else if(isNaN(rotationAngle)) return "rotation angle is a non numeric value for animation with ID = " + animationID;
				else if(rotationAngle == 0) return "rotation angle can't be 0 for animation with ID = " + animationID;
				
				
				let circularAnimation = new MyCircularAnimation(animationID, animationSpeed, vec3.fromValues(center[0], center[1], center[2]), radius, initAngle, rotationAngle);
				this.animations[animationID] = circularAnimation;
			break;
			
			case "bezier":
				
				//Parse control points
				let bezierCPElem = animationNodes[i].children;
				if(bezierCPElem.length != 4) return "exactly 4 control points must be defined for bezier animation with ID = " + animationID;

				let bezierControlPoints = [];
				let bezcpX, bezcpY, bezcpZ;
				
				//Parse coordinates for each control point and validate them
				for(let i = 0; i < bezierCPElem.length; i++) {
					
					bezcpX = this.reader.getFloat(bezierCPElem[i], 'xx');
					bezcpY = this.reader.getFloat(bezierCPElem[i], 'yy');
					bezcpZ = this.reader.getFloat(bezierCPElem[i], 'zz');
					
					let bezierCP = [];
					bezierCP.push(bezcpX, bezcpY, bezcpZ);
					
					//Checks control point array for null or NaN
					if(MyUtility.checkNull(bezierCP)) return "unable to parse control point #" + (i + 1) + " for animation with ID = " + animationID;
					else if(MyUtility.checkNaN(bezierCP)) return "control point #" + (i + 1) + " has non numeric value(s) for animation with ID = " + animationID;
					
					bezierControlPoints.push(vec3.fromValues(bezcpX, bezcpY, bezcpZ));
				}
				
				let bezierAnimation = new MyBezierAnimation(animationID, animationSpeed, bezierControlPoints);
				this.animations[animationID] = bezierAnimation;
			break;
			
			case "combo":
				
				//Parse spanrefs
				let spanRefElem = animationNodes[i].children;
				if(spanRefElem.length < 1) return "at least 1 <SPANREF> must be defined for combo animation with ID = " + animationID;

				let spanRefs = [];
				
				//Parse each spanref and validate them
				for(let i = 0; i < spanRefElem.length; i++) {
					
					let spanRef = this.reader.getString(spanRefElem[i], 'id');

					if(spanRefElem[i].nodeName != "SPANREF") this.onXMLMinorError("<SPANREF> #" + (i + 1) + " tag name isn't <SPANREF> for animation with ID = " + animationID);
					
					if(spanRef == null) return "unable to parse <SPANREF> #" + (i + 1) + " for animation with ID = " + animationID;
					spanRef = spanRef.trim();
					
					if(this.animations[spanRef] == null) return "<SPANREF> #" + (i + 1) + " references non existing animation for animation with ID = " + animationID;
					else if(this.animations[spanRef] instanceof MyComboAnimation) return "combo animation can't have nested combo animations, found in <SPANREF> #" + (i + 1) + " for animation with ID = " + animationID;
					
					spanRefs.push(spanRef);
				}
					
				let comboAnimation = new MyComboAnimation(animationID, spanRefs);
				this.animations[animationID] = comboAnimation;
			break;
		}
		
		//Check if number of attributes is correct for <ANIMATION> tag
		let attrNumWrongFlag = false;
		
		switch(attributeLength) {
			
			case 2:
				if(animationType != "combo") attrNumWrongFlag = true;
			break;
			
			case 3:
				if(animationType != "linear" && animationType != "bezier") attrNumWrongFlag = true;
			break;
			
			case 9:
				if(animationType != "circular") attrNumWrongFlag = true;
			break;
			
			default:
				attrNumWrongFlag = true;
			break;
		}
		
		if(attrNumWrongFlag) this.onXMLMinorError("extra attributes found for animation with ID = " + animationID);
	}

	console.log("Parsed animations");
}

/**
 * Parses the <NODES> block.
 */
MySceneGraph.prototype.parseNodes = function(nodesNode) {
    
    // Traverses nodes.
    var children = nodesNode.children;

    for (var i = 0; i < children.length; i++) {
        var nodeName;
        if ((nodeName = children[i].nodeName) == "ROOT") {
            // Retrieves root node.
            if (this.idRoot != null )
                return "there can only be one root node";
            else {
                var root = this.reader.getString(children[i], 'id');
                if (root == null )
                    return "failed to retrieve root node ID";
                this.idRoot = root;
            }
        } 
        else if (nodeName == "NODE") {
            // Retrieves node ID.
            var nodeID = this.reader.getString(children[i], 'id');
            if (nodeID == null )
                return "failed to retrieve node ID";
            // Checks if ID is valid.
            if (this.nodes[nodeID] != null )
                return "node ID must be unique (conflict: ID = " + nodeID + ")";
            
			// Check if node has selectable attribute
			let selectExists = this.reader.hasAttribute(children[i], 'selectable');
			let selectable = false;
			
			// Parse selectable attribute
			if(selectExists) selectable = this.reader.getBoolean(children[i], 'selectable');
			
			if(selectExists && selectable == null) return "unable to parse selectable value (node ID = " + nodeID + ")";
			if(selectable) this.selectableNodes.push(nodeID);
			
            this.log("Processing node " + nodeID);

            // Creates node.
            this.nodes[nodeID] = new MyGraphNode(this,nodeID);

            // Gathers child nodes.
            var nodeSpecs = children[i].children;
            var specsNames = [];
            var possibleValues = ["MATERIAL", "TEXTURE", "TRANSLATION", "ROTATION", "SCALE", "ANIMATIONREFS", "DESCENDANTS"];
            for (var j = 0; j < nodeSpecs.length; j++) {
                var name = nodeSpecs[j].nodeName;
                specsNames.push(nodeSpecs[j].nodeName);
                
                // Warns against possible invalid tag names.
                if (possibleValues.indexOf(name) == -1)
                    this.onXMLMinorError("unknown tag <" + name + ">");
            }
            
            // Retrieves material ID.
            var materialIndex = specsNames.indexOf("MATERIAL");
            if (materialIndex == -1)
                return "material must be defined (node ID = " + nodeID + ")";
            var materialID = this.reader.getString(nodeSpecs[materialIndex], 'id');
            if (materialID == null )
                return "unable to parse material ID (node ID = " + nodeID + ")";
            if (materialID != "null" && this.materials[materialID] == null )
                return "ID does not correspond to a valid material (node ID = " + nodeID + ")";
            
            this.nodes[nodeID].materialID = materialID;
            
            // Retrieves texture ID.
            var textureIndex = specsNames.indexOf("TEXTURE");
            if (textureIndex == -1)
                return "texture must be defined (node ID = " + nodeID + ")";
            var textureID = this.reader.getString(nodeSpecs[textureIndex], 'id');
            if (textureID == null )
                return "unable to parse texture ID (node ID = " + nodeID + ")";
            if (textureID != "null" && textureID != "clear" && this.textures[textureID] == null )
                return "ID does not correspond to a valid texture (node ID = " + nodeID + ")";
            
            this.nodes[nodeID].textureID = textureID;
            
            // Retrieves possible transformations.
            for (var j = 0; j < nodeSpecs.length; j++) {
                switch (nodeSpecs[j].nodeName) {
                case "TRANSLATION":
                    // Retrieves translation parameters.
                    var x = this.reader.getFloat(nodeSpecs[j], 'x');
                    if (x == null ) {
                        this.onXMLMinorError("unable to parse x-coordinate of translation; discarding transform");
                        break;
                    }
                    else if (isNaN(x))
                        return "non-numeric value for x-coordinate of translation (node ID = " + nodeID + ")";

                    var y = this.reader.getFloat(nodeSpecs[j], 'y');
                    if (y == null ) {
                        this.onXMLMinorError("unable to parse y-coordinate of translation; discarding transform");
                        break;
                    }
                    else if (isNaN(y))
                        return "non-numeric value for y-coordinate of translation (node ID = " + nodeID + ")";

                    var z = this.reader.getFloat(nodeSpecs[j], 'z');
                    if (z == null ) {
                        this.onXMLMinorError("unable to parse z-coordinate of translation; discarding transform");
                        break;
                    }
                    else if (isNaN(z))
                        return "non-numeric value for z-coordinate of translation (node ID = " + nodeID + ")";

                    mat4.translate(this.nodes[nodeID].transformMatrix, this.nodes[nodeID].transformMatrix, [x, y, z]);
                    break;
                case "ROTATION":
                    // Retrieves rotation parameters.
                    var axis = this.reader.getItem(nodeSpecs[j], 'axis', ['x', 'y', 'z']);
                    if (axis == null ) {
                        this.onXMLMinorError("unable to parse rotation axis; discarding transform");
                        break;
                    }
                    var angle = this.reader.getFloat(nodeSpecs[j], 'angle');
                    if (angle == null ) {
                        this.onXMLMinorError("unable to parse rotation angle; discarding transform");
                        break;
                    }
                    else if (isNaN(angle))
                        return "non-numeric value for rotation angle (node ID = " + nodeID + ")";

                    mat4.rotate(this.nodes[nodeID].transformMatrix, this.nodes[nodeID].transformMatrix, angle * DEGREE_TO_RAD, this.axisCoords[axis]);
                    break;
                case "SCALE":
                    // Retrieves scale parameters.
                    var sx = this.reader.getFloat(nodeSpecs[j], 'sx');
                    if (sx == null ) {
                        this.onXMLMinorError("unable to parse x component of scaling; discarding transform");
                        break;
                    }
                    else if (isNaN(sx))
                        return "non-numeric value for x component of scaling (node ID = " + nodeID + ")";

                    var sy = this.reader.getFloat(nodeSpecs[j], 'sy');
                    if (sy == null ) {
                        this.onXMLMinorError("unable to parse y component of scaling; discarding transform");
                        break;
                    }
                    else if (isNaN(sy))
                        return "non-numeric value for y component of scaling (node ID = " + nodeID + ")";

                    var sz = this.reader.getFloat(nodeSpecs[j], 'sz');
                    if (sz == null ) {
                        this.onXMLMinorError("unable to parse z component of scaling; discarding transform");
                        break;
                    }
                    else if (isNaN(sz))
                        return "non-numeric value for z component of scaling (node ID = " + nodeID + ")";
                        
                    mat4.scale(this.nodes[nodeID].transformMatrix, this.nodes[nodeID].transformMatrix, [sx, sy, sz]);
                    break;
                default:
                    break;
                }
            }
			
			// Retrieves information about animation references
			let animationIndex = specsNames.indexOf("ANIMATIONREFS");
			if (animationIndex == -1) {
				this.nodes[nodeID].animationHandler = new MyAnimationHandler([], true);
				this.animationHandlers.push(this.nodes[nodeID].animationHandler);
			} else {
				
				// Get individual animation references
				let animationRefsElem = nodeSpecs[animationIndex].children;
				let animationRefs = [];
				
				if(animationRefsElem.length == 0) {
					this.nodes[nodeID].animationHandler = new MyAnimationHandler([], true);
					this.animationHandlers.push(this.nodes[nodeID].animationHandler);
					this.onXMLMinorError("<ANIMATIONREFS> exists but no animations referenced, assuming identity matrix (node ID = " + nodeID + ")");
				} else {
				
					// Validate animation references and add them to array
					for (let i = 0; i < animationRefsElem.length; i++) {
						
						if(animationRefsElem[i].nodeName != "ANIMATIONREF") this.onXMLMinorError("<ANIMATIONREF> #" + (i + 1) + " tag name isn't <ANIMATIONREF> (node ID = " + nodeID + ")");
						
						let animRef = this.reader.getString(animationRefsElem[i], 'id');
						
						if (animRef == null) return "unable to parse animation reference (node ID = " + nodeID + ")";
						animRef = animRef.trim();
						
						if (this.animations[animRef] == null) return "animation referenced does not exist (node ID = " + nodeID + ")";
						
						this.log("   AnimationRef: " + animRef);
						
						// Fill array with current animation reference or unpack combo animation to individual animations
						if(this.animations[animRef] instanceof MyComboAnimation) {
							
							let spanRefs = this.animations[animRef].getAnimations();
							
							for(let j = 0; j < spanRefs.length; j++) {
								
								animationRefs.push(this.animations[spanRefs[j]]);
							}
						} else animationRefs.push(this.animations[animRef]);
					}
					
					// Store in node and graph the animations for this node
					this.nodes[nodeID].animationHandler = new MyAnimationHandler(animationRefs, false);
					this.animationHandlers.push(this.nodes[nodeID].animationHandler);
				}
			}

            // Retrieves information about children.
            var descendantsIndex = specsNames.indexOf("DESCENDANTS");
            if (descendantsIndex == -1)
                return "an intermediate node must have descendants";

            var descendants = nodeSpecs[descendantsIndex].children;
            
            var sizeChildren = 0;
            for (var j = 0; j < descendants.length; j++) {
                if (descendants[j].nodeName == "NODEREF")
				{
                    
					var curId = this.reader.getString(descendants[j], 'id');

					this.log("   Descendant: "+curId);

                    if (curId == null )
                        this.onXMLMinorError("unable to parse descendant id");
                    else if (curId == nodeID)
                        return "a node may not be a child of its own";
                    else {
                        this.nodes[nodeID].addChild(curId);
                        sizeChildren++;
                    }
                }                    
                else
					if (descendants[j].nodeName == "LEAF")
					{
						var type=this.reader.getItem(descendants[j], 'type', ['rectangle', 'cylinder', 'sphere', 'triangle', 'patch']);
						
						if (type != null)
							this.log("   Leaf: "+ type);
						else
							this.warn("Error in leaf");
						
						//parse leaf
						var newLeaf = new MyGraphLeaf(this, descendants[j], type);
						if(newLeaf.error != null) return newLeaf.error;
						
						this.nodes[nodeID].addLeaf(newLeaf);
                        sizeChildren++;
					}
					else
						this.onXMLMinorError("unknown tag <" + descendants[j].nodeName + ">");

            }
            if (sizeChildren == 0)
                return "at least one descendant must be defined for each intermediate node";
        } 
        else
            this.onXMLMinorError("unknown tag name <" + nodeName);
    }
	
	// Create associative array of selectable nodes, start from 1 because 0 is already defined as "no selection"
	for(let i = 1; i < this.selectableNodes.length; i++) {
		this.selectableListBox[this.selectableNodes[i]] = i;
	}
	
    console.log("Parsed nodes");
    return null ;
}

/**
 * Callback to be executed on any read error
 */
MySceneGraph.prototype.onXMLError = function(message) {
    console.error("XML Loading Error: " + message);
    this.loadedOk = false;
}

/**
 * Callback to be executed on any minor error, showing a warning on the console.
 */
MySceneGraph.prototype.onXMLMinorError = function(message) {
    console.warn("Warning: " + message);
}

MySceneGraph.prototype.log = function(message) {
    console.log("   " + message);
}

/**
 * Generates a default material, with a random name. This material will be passed onto the root node, which
 * may override it.
 */
MySceneGraph.prototype.generateDefaultMaterial = function() {
    var materialDefault = new CGFappearance(this.scene);
    materialDefault.setShininess(1);
    materialDefault.setSpecular(0, 0, 0, 1);
    materialDefault.setDiffuse(0.5, 0.5, 0.5, 1);
    materialDefault.setAmbient(0, 0, 0, 1);
    materialDefault.setEmission(0, 0, 0, 1);

    // Generates random material ID not currently in use.
    this.defaultMaterialID = null;
    do this.defaultMaterialID = MySceneGraph.generateRandomString(5);
    while (this.materials[this.defaultMaterialID] != null);

    this.materials[this.defaultMaterialID] = materialDefault;
}

/**
 * Generates a random string of the specified length.
 */
MySceneGraph.generateRandomString = function(length) {
    // Generates an array of random integer ASCII codes of the specified length
    // and returns a string of the specified length.
    var numbers = [];
    for (var i = 0; i < length; i++)
        numbers.push(Math.floor(Math.random() * 256));          // Random ASCII code.
    
    return String.fromCharCode.apply(null, numbers);
}

/**************************************************************
 *
 * Scene display functions
 * 
 *************************************************************/

/**
 * Calls the recursive display function with the root node.
 */
MySceneGraph.prototype.displayScene = function() {
	
	//Check if root node has material, assume default if not
	if(this.nodes[this.idRoot].materialID == "null") {
		if(!this.rootMaterialFlag) this.onXMLMinorError("root node has no material, assuming defaultMaterial");
		this.materialStack.push(this.defaultMaterialID);
	    this.materials[this.materialStack[this.materialStack.length - 1]].apply();
		this.rootMaterialFlag = true;
	}
	
	this.recursiveDisplay([this.idRoot]);
}

/**
 * Recursive function that displays the scene, processing each node, starting with the root node.
 */
MySceneGraph.prototype.recursiveDisplay = function(nodes) {
	
	for(var i = 0; i < nodes.length; i++) {
		
		//Apply expand/saturate shader on selected node
		if(this.nodes[nodes[i]].nodeID == this.selectableNodes[this.currSelectedNode]) {
			this.scene.setActiveShader(this.shaders[this.currSelectedShader]);
		}
		
		this.scene.pushMatrix();
		
		//Apply object transformations and animation transformations
		this.scene.multMatrix(this.nodes[nodes[i]].transformMatrix);
		this.scene.multMatrix(this.nodes[nodes[i]].animationHandler.transformMatrix);
		
		//Gets material and texture status for deciding whether stack should be pushed or kept
		var keepMaterial = this.nodes[nodes[i]].materialID == "null";
		var textureStatus = this.nodes[nodes[i]].textureID;

		//Push new material and texture
		if(!keepMaterial) {
			this.materialStack.push(this.nodes[nodes[i]].materialID);
		}
		
		if(textureStatus != "null" && textureStatus != "clear") {
			this.textureStack.push(this.nodes[nodes[i]].textureID);
		}
		
		//Apply current material and texture which are the ones at the top of the stacks
	    this.materials[this.materialStack[this.materialStack.length - 1]].apply();
		
		if(this.textureStack.length > 0 && textureStatus != "clear") {
			this.textures[this.textureStack[this.textureStack.length - 1]][0].bind();
		}

		//Draw primitives for current node and update texture coords if applicable
		for(var j = 0; j < this.nodes[nodes[i]].leaves.length; j++) {
		
			if(this.textureStack.length > 0) {
				this.textureCoordUpdate(this.nodes[nodes[i]].leaves[j], this.textures[this.textureStack[this.textureStack.length - 1]]);
			}
			this.nodes[nodes[i]].leaves[j].primitive.display();
	    }
		
		//Recursive call to current node's children
		if(this.nodes[nodes[i]].children.length > 0) this.recursiveDisplay(this.nodes[nodes[i]].children);
		
		//Pops material and texture stacks
		if(!keepMaterial) this.materialStack.pop();
		if(textureStatus != "null" && textureStatus != "clear") this.textureStack.pop();
		
		this.scene.popMatrix();
		
		//Selected node finished rendering all descendants, set default shader
		if(this.nodes[nodes[i]].nodeID == this.selectableNodes[this.currSelectedNode]) {
			this.scene.setActiveShader(this.scene.defaultShader);
		}
	}
}

/**
 * Update texture coords with texture factors if leaf is of type Rectangle or Triangle.
 */
MySceneGraph.prototype.textureCoordUpdate = function(leaf, currTexture) {
	
	if(leaf.type != "rectangle" && leaf.type != "triangle") return;
	
	leaf.primitive.updateTexCoords(currTexture[1], currTexture[2]);
}