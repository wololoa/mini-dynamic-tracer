
// todo: move this thing to separate files pretty please

var APP_WIDTH           = 840;
var APP_HEIGHT          = 480;

var GLOBAL_OBJ_ID       = 0;
var GLOBAL_LIGHT_ID     = 0;

var g_shaderSrc 		= "";

function getValue(v)
{
	var number = v;
	return isNaN(number) ? 0.0 : number.toFixed(4); // NaN bug fix
}

// sdCube todo: FUNCTIONS
// todo: MATERIALS

//---------------------------------------------------------------------------------

var GUIObject = Entity.extend({

	gui : null,
	recompile : false,

	constructor : function(gui)
	{
		this.callParent();

		if(!Utils.isEmpty(gui))
		{
			this.gui = gui;
			this.createGUI();
		}
	},

	createGUI : function()
	{
		// override by child classes
	},

	onPropertyChanged : function()
	{
		this.recompile = true;
	},

	shouldRecompile : function()
	{
		var ret = this.recompile; // why not simply do a callback to the tracer or something? I don't know.
		this.recompile = false;
		return ret;
	}

});

//---------------------------------------------------------------------------------------

var PointLight = GUIObject.extend({

	alive : true, // hack to know if the object exists on the UI side. shitty.
	id : 0,
	isStatic : true,
	isEnabled : true,
	position : null,
	color : null,
	size : 1.0,
	intensity : 1.0,
	specPower : 1.0,
	scene : null,

	constructor : function(gui, scene)
	{
        GLOBAL_LIGHT_ID += 1;
        this.id = GLOBAL_LIGHT_ID;
		this.position = {x: 0.0, y: 0.5, z: 0.0 };
        this.color = [ 255, 0, 0 ];

		this.scene = scene;
		this.callParent(gui);
	},

	createGUI : function()
	{
		var f1 = this.gui.addFolder("PointLight " + this.id); // todo> make function "get name"
		f1.add(this, 'isStatic').name('Static').onFinishChange( this.onPropertyChanged.bind(this) );
		f1.add(this, 'isEnabled').name('Enabled').onFinishChange( this.onPropertyChanged.bind(this) );

		var f2 = f1.addFolder("Transform");
		f2.add(this.position, 'x').onFinishChange( this.onPropertyChanged.bind(this) );
		f2.add(this.position, 'y').onFinishChange( this.onPropertyChanged.bind(this) );
		f2.add(this.position, 'z').onFinishChange( this.onPropertyChanged.bind(this) );

		f1.add(this, 'size', 0.0, 10.0).name('Size').onFinishChange( this.onPropertyChanged.bind(this) );
		f1.add(this, 'intensity').name('Intensity').onFinishChange( this.onPropertyChanged.bind(this) );
		f1.add(this, 'specPower').name('Spec. Power').onFinishChange( this.onPropertyChanged.bind(this) );
		f1.addColor(this, 'color').name('Color').onFinishChange( this.onPropertyChanged.bind(this) );

		var controller = f1.add(this, 'removeGUI').name('Delete');
	},

	removeGUI : function()
	{
		this.alive = false;
		this.gui.removeFolder("PointLight " + this.id);
		this.scene.removePointLight();
	},

	// TODO: OPTIMIZE THIS SHIT AND DO NOT CREATE A NEW OBJECT EVERY FUCKING FRAME! (just change the data)
	getUniforms : function()
	{
		var uniforms = {
			items : [			
				{ name: 'u_light' + this.id + 'Color', 		type: '3a', value: this.color }, // a = array [0, 1, 2]
				{ name: 'u_light' + this.id + 'Pos', 		type: '3v', value: this.position }, // v = vector {x, y, z}
				{ name: 'u_light' + this.id + 'Size', 		type: '1f', value: this.size },
				{ name: 'u_light' + this.id + 'Intensity', 	type: '1f', value: this.intensity }
		]};
		
		return uniforms;
	},
	
	getUniformsSrc : function()
	{
		var src = '';

		if(!this.isStatic && this.isEnabled)
		{
			src = 'uniform vec3 u_light' + this.id + 'Color;';
			src += '\n uniform vec3 u_light' + this.id + 'Pos;';
			src += '\n uniform float u_light' + this.id + 'Size;';
			src += '\n uniform float u_light' + this.id + 'Intensity;\n';
		}
		return src;
	},

	getSrc : function()
	{
		var src = '';

		if(this.isEnabled)
		{
			var x = getValue(this.position.x);
			var y = getValue(this.position.y);
			var z = getValue(this.position.z);

			var r = getValue(this.color[0] / 255.0);
			var g = getValue(this.color[1] / 255.0);
			var b = getValue(this.color[2] / 255.0);

			var size = getValue(this.size);
			var intensity = getValue(this.isStatic ? this.intensity * 100.0 : this.intensity); // wtf is going on here???
			var specPower = getValue(this.specPower);

			if(this.isStatic)
			{
				src = 'vec3 light' + this.id + '= pointLight(pos, vec3('+ x +', '+ y +', '+ z +'), vec3('+ r +', '+ g +', '+ b +'), '+ size +', '+ intensity +'); \n'
			}
			else
			{
				src = 'vec3 light' + this.id + '= pointLight(pos, u_light' + this.id + 'Pos, u_light' + this.id + 'Color, u_light' + this.id + 'Size, u_light' + this.id + 'Intensity); \n'
			}
			src += 'light' + this.id + ' += clamp(dot(light' + this.id + ', -nor) * '+ specPower +', 0.0, 1.0);\n'
		}
		return src;
	}

});

var Scene = GUIObject.extend({

	// ---------- GLOBALS ----------
    // TODO: SCENE PRESETS!!! (like cornel, empty, etc)
	// TODO: LOAD AND SAVE SCENE!
	width : 840,
	height : 480,
	rayRes : 64.0,
	shadowRes : 24.0,
	aoRes : 6.0,
	aoStrength : 8.0,

	// ---------- CAMERA ----------
	cameraPosition : null,
	cameraView : null,
	cameraSpeed : 2.0,
	cameraFov : 2.0,

	// ---------- ENVIRONMENT ----------
	isEnvEnabled : true, // set to false to fuck it all :D
	bgrColor : null,

	// TODO> ADD FOG!!!!!!!!

	// TODO> ADD TERRAIN!!!!!!!!!!!!!!!!

	// horizon
	horizonEnabled : true,
	horizonStatic : true,
	horizonColor : null,
	horizonGradient : 8.0,
	horizonSize : 0.10,

	// clouds
	cloudsEnabled : true,
	cloudsStatic : true, // position missing? animation time?
	cloudsColor : null,
	cloudsHeight : 1000.0,
	cloudsSizeMin : 0.23,
	cloudsSizeMax : 0.8,
	cloudsAmount : 0.5,
	cloudsNoiseSize : 0.0005,

	// sun
	sunEnabled : true,
	sunStatic : true,
	sunColor : null,
	sunInvSize : 5.0,
	sunStrength : 0.5, // IN SKY!
	sunLightPos : null, // array NOTE: THIS SHIT SHOULD BE USED FOR THE MAIN SUNLIGHT POSITION AS WELL, OR SOMETHING!!!
	// TODO: USE THE OTHER VALUES FOR THE ACTUAL SUN LIGHT HITTING THE SCENE!

	// TODO> MOON???????

	// ---------- POSTPROCESSING ----------
	// gamma correction
	gammaEnabled : true,
	gammaAmount : 0.35,

	// todo> tonemapping????
	// todo> FILMIC GRAIN! (the order forthefuck)
	// todo> LENS FUCKIN' FLARE!

	// contrast
	contrastEnabled : true,
	contrastValue : 0.5,

	// desaturation
	desaturationEnabled : false,
	//desatColor : null,
	desaturationStrength : 0.25,

	// tinting
	tintingEnabled : true,
	tintingColor : null,

	// vignetting
	vignettingEnabled : true,
	vignettingMin : 0.5,
	vignettingMax : 0.5,


    objects : null,
    lights : null,

	//tracer : null,
	//gui : null,
	//recompile : false,

	// todo: params
	constructor : function(gui)
	{
		this.bgrColor = [ 255, 255, 255 ];
		this.sunLightPos = { x: 0.5, y: 3.5, z: 0.0 };
		this.cameraPosition = { x: 0.5, y: 0.8, z: 2.5 };
		this.cameraView = {x: 0.0, y: 0.2, z: 0.1 };
        this.horizonColor = [ 255, 255, 255 ];
        this.lights = [];
		this.callParent(gui);
	},

	createGUI : function()
	{

		var addLightController = this.gui.add(this, 'addPointLight').name('Add point light');		
		addLightController.onFinishChange( this.onPropertyChanged.bind(this) );

		var showShaderController = this.gui.add(this, 'printShader').name('Debug print shader');		
		
		var f1 = this.gui.addFolder("GLOBALS");
		f1.add(this, 'width', 240, 1920).name("Width").onFinishChange( this.onPropertyChanged.bind(this) );
		f1.add(this, 'height', 120, 1920).name("Height").onFinishChange( this.onPropertyChanged.bind(this) );
		f1.add(this, 'rayRes', 1.0, 256.0).name("Ray resolution").onFinishChange( this.onPropertyChanged.bind(this) );
		f1.add(this, 'shadowRes', 1.0, 128.0).name("Softshadow res").onFinishChange( this.onPropertyChanged.bind(this) );
		f1.add(this, 'aoRes', 1.0, 128.0).name("AO res").onFinishChange( this.onPropertyChanged.bind(this) );
		f1.add(this, 'aoStrength', 0.0, 50.0).name("AO strength").onFinishChange( this.onPropertyChanged.bind(this) );
		//f1.open();

		// todo: bring a good fps cam pretty please
		var f2 = this.gui.addFolder("CAMERA");
		f2.add(this, 'cameraSpeed', 1.0, 10.0).name("Speed");
		f2.add(this, 'cameraFov', 0.1, 8.0).name("Fov");
		var f21 = f2.addFolder("Position");
		f21.add(this.cameraPosition, 'x', -25.0, 25.0).listen();
		f21.add(this.cameraPosition, 'y', -25.0, 25.0).listen();
		f21.add(this.cameraPosition, 'z', -25.0, 25.0).listen();
		var f22 = f2.addFolder("View");
		f22.add(this.cameraView, 'x', -15.0, 15.0);
		f22.add(this.cameraView, 'y', -15.0, 15.0);
		f22.add(this.cameraView, 'z', -15.0, 15.0);


		var f3 = this.gui.addFolder("ENVIRONMENT");
		f3.add(this, 'isEnvEnabled', true).name("Enabled").onFinishChange( this.onPropertyChanged.bind(this) );
		f3.addColor(this, 'bgrColor').name("Bgr color").onFinishChange( this.onPropertyChanged.bind(this) );

		var f31 = f3.addFolder("SUN");
		//sunStatic : true,
		//sunColor : null,
		//sunInvSize : 5.0,
		//sunStrength : 0.5, // IN SKY!
		//sunLightPos : null, // array NOTE: THIS SHIT SHOULD BE USED FOR THE MAIN SUNLIGHT POSITION AS WELL, OR SOMETHING!!!
		var sunHideController = f31.add(this, 'hideShowSun').name("Hide/Show");
		var f311 = f31.addFolder("Position");
		f311.add(this.sunLightPos, 'x', -25.0, 25.0).onFinishChange( this.onPropertyChanged.bind(this) );
		f311.add(this.sunLightPos, 'y', -25.0, 25.0).listen().onFinishChange( this.onPropertyChanged.bind(this) );
		f311.add(this.sunLightPos, 'z', -25.0, 25.0).onFinishChange( this.onPropertyChanged.bind(this) );


		var f32 = f3.addFolder("CLOUDS");

		var f33 = f3.addFolder("HORIZON");
		f33.add(this, 'horizonEnabled', true).onFinishChange( this.onPropertyChanged.bind(this) );
		//f33.add(this, 'horizonStatic', true); // TODO!
        f33.addColor(this, 'horizonColor').onFinishChange( this.onPropertyChanged.bind(this) );
        f33.add(this, 'horizonGradient', 0.0, 16.0).onFinishChange( this.onPropertyChanged.bind(this) );
        f33.add(this, 'horizonSize', 0.0, 1.0).onFinishChange( this.onPropertyChanged.bind(this) );
		f33.open();

		//this.addPointLight();

	},

	// one day I will have to read this shit to remember why in all heavens I'm not just executing a callback
	shouldRecompile : function()
	{
		var ret = false;
		var shouldRecompileLights = false;

		for(var i = 0; i < this.lights.length; i++)
		{
			shouldRecompileLights = this.lights[i].shouldRecompile();
			if(shouldRecompileLights)
			{
				ret = true;
			}
		}

		if(shouldRecompileLights === false)
		{
			ret = this.recompile;
			this.recompile = false;
		}

		return ret;
	},
	
	// todo: print to file
	printShader : function()
	{
		console.log("---------------------------------------------------\n", g_shaderSrc);
	},
	
	addPointLight : function()
	{
		var pointLight = new PointLight(this.gui, this);
		this.lights.push(pointLight);
	},

	removePointLight : function(light)
	{
		var index = this.lights.indexOf(light);
		this.lights.splice(index, 1);
		this.onPropertyChanged(); // force reload
	},

	// find object by name (useful to do things later)
	getPointLight : function(name)
	{
		// todo
	},

	hideShowSun : function()
	{
		if(this.sunLightPos.y > 0)
		{
			this.sunLightPos.y = -10.0;
		}
		else
		{
			this.sunLightPos.y = 3.5;
		}
	},
	
	update : function(delta)
	{
		this.callParent(delta);


		if(Input.isKeyPressed(Input.KEY_A))
		{
			this.cameraPosition.x -= delta * this.cameraSpeed;
		}
		else if(Input.isKeyPressed(Input.KEY_D))
		{
			this.cameraPosition.x += delta * this.cameraSpeed;
		}

		if(Input.isKeyPressed(Input.KEY_Q))
		{
			this.cameraPosition.y -= delta * this.cameraSpeed;
		}
		else if(Input.isKeyPressed(Input.KEY_E))
		{
			this.cameraPosition.y += delta * this.cameraSpeed;
		}

		if(Input.isKeyPressed(Input.KEY_W))
		{
			this.cameraPosition.z -= delta * this.cameraSpeed;
		}
		else if(Input.isKeyPressed(Input.KEY_S))
		{
			this.cameraPosition.z += delta * this.cameraSpeed;
		}


	},

	//------------------------------------------------
	// src

	getLightsUniforms : function()
	{
		var src = '';

		for(var i = 0; i < this.lights.length; i++)
		{
			if(this.lights[i].alive)
			{
				src += this.lights[i].getUniformsSrc();
			}
		}
		return src;
	},

	getLightsSrc : function()
	{
		var src = '';

		for(var i = 0; i < this.lights.length; i++)
		{
			if(this.lights[i].alive)
			{
				src += this.lights[i].getSrc();
			}
		}
		//console.log(this.lights);
		//console.log("\n\n LIGHTS CODE: \n\n" + src);
		return src;
	},

	getLightsFinalSrc : function()
	{
		var src = '';
		var temp = '';
		var lights = 0;

		for(var i = 0; i < this.lights.length; i++)
		{
			if(this.lights[i].alive && this.lights[i].isEnabled)
			{
				lights++;
				if(lights > 1)
				{
					temp += ' + ';
				}
				temp += 'light'+this.lights[i].id;
			}
		}

		if(lights > 0)
		{
			//lin = (light1 + light2 + light3) * occ;
			src = 'lin = (' + temp + ') * occ; \n';
		}

		return src;
	},

    // environment
    getHorizonSrc : function()
    {
        var src = '';

        // TODO: make this dynamic!
		// horizonStatic : true,
        if(this.horizonEnabled)
        {
        	var r = getValue(this.horizonColor[0] / 255.0);
            var g = getValue(this.horizonColor[1] / 255.0);
            var b = getValue(this.horizonColor[2] / 255.0);
            src = 'col = mix( col, vec3('+ r +','+ g +','+ b +'), pow( 1.0 - max(rd.y,'+ getValue(this.horizonSize) +'), '+ getValue(this.horizonGradient) +') );';
        }
        return src;
    }

    /*
    getCloudsSrc : function()
    {
        // clouds
        cloudsEnabled : true,
        cloudsStatic : true, // position missing? animation?
        cloudsColor : null,
        cloudsHeight : 1000.0,
        cloudsSizeMin : 0.23,
        cloudsSizeMax : 0.8,
        cloudsAmount : 0.5,
        cloudsNoiseSize : 0.0005,
    },

    getSunSrc : function()
    {
        // sun
        sunEnabled : true,
        sunStatic : true,
        sunColor : null,
        sunInvSize : 5.0,
        sunStrength : 0.5,
        sunPos : null, // array NOTE: THIS SHIT SHOULD BE USED FOR THE MAIN SUNLIGHT POSITION AS WELL, OR SOMETHING!!!
    },

	// todo> tonemapping????
	// todo> FILMIC GRAIN! (the order forthefuck)
	// todo> LENS FUCKING FLARE!

    // postprocessing stuff
    getGammaSrc : function()
    {
        gammaEnabled : true,
        gammaAmount : 0.35,
    },

    getContrastSrc : function()
    {
        contrastEnabled : true,
        contrastValue : 0.5,
    },

    getDesaturationSrc : function()
    {
        desaturationEnabled : false,
        //desatColor : null,
        desaturationStrength : 0.25,
    },

    getTintingSrc : function()
    {
        tintingEnabled : true,
        tintingColor : null,
    },

    getVignettingSrc : function()
    {
        vignettingEnabled : true,
        vignettingMin : 0.5,
        vignettingMax : 0.5,
    }
    */


	// New object
	// New point light
	// New area light (?)
	// EXPORT SCENE
	// IMPORT SCENE

});



// needed for update
var Object3D = GUIObject.extend({

	id : -1,
	isEnabled : true,
	isStatic : true,
	primitiveID : 'sdCube',
	pos : null,
	size : null,
	rotation : null,
	// TODO: REPEAT!!!!!!!!!!!!!!!!!!!!!
	// TODO: ADD THE FUNCTION FOR THE NEXT OBJECT TO COME!!! (note: union by default?)
	color : null,
	texture : '',
	useBump : false, // perhaps just put a "none" and be done with it???
	bumpType : '',  // patterns? natural bumps? irregular? etc
	bumpIntensity : 0.0,
	reflect : false,
	reflectColor : null,
	refractColor : null,
	useAreaLight : false,
	areaLightSpecPower : 0.0,
	glossyness : 0.0,


	constructor : function(tracer, gui)
	{
		this.callParent(gui);

		this.id = GLOBAL_OBJ_ID++;

	},

	//-----------------------------------------------------
	createGUI : function()
	{
		var f1 = this.gui.addFolder("Object " + this.id); // todo> make function "get name"
		//f1.addColor(this, 'color');
		f1.add(this, 'id');
		f1.add(this, 'x', 0, Graphics.width);
		f1.add(this, 'y', 0, Graphics.height);
		//f1.add(this, 'w', 0, Graphics.width);
		//f1.add(this, 'h', 0, Graphics.height);
		var controller = f1.add(this, 'removeGUI').name('Delete');
		//f1.open();
	},

	removeGUI : function()
	{
		this.gui.removeFolder("Object " + this.id);
	},

	//-----------------------------------------------------

	// at the beginning, needed if non static
	// material doesn't change for now
	getUniforms : function()
	{
		return '';
	},

	// return the distance function, which can be anything
	// todo: perhaps return the function id???
	getDistance : function()
	{
		return '';
	},

	// return the code for the material, which again, can be anything
	getMaterial : function()
	{
		return '';
	},

	onPropertyChanged : function(prop)
	{
		this.tracer.onPropertyChanged(this);
	},

	shouldRecompile : function()
	{
		return this.isStatic;
	}

});


var Tracer = Entity.extend({

	canvas : null,
	gl : null,
	vertexShader : null,
	fragmentShader : null,
	vertices : null,
	program : null,
	buffer : null,

	timeLocation : null, // add other locations? or remove this shit entirely?
	positionLocation : null,
	texture1 : null, // change to "textures" array/map!!!
	texture2 : null,

	gui : null,
	scene : null,

	constructor : function(gl)
	{
		this.callParent();
	},

    init : function()
    {
    	this.bgr = { r:Utils.randRange(0.0, 0.9), g:Utils.randRange(0.0, 0.9), b:Utils.randRange(0.0, 0.9) };

		//-----------------------------------------------------------
        this.canvas = document.createElement("canvas");
		this.gl = getWebGLContext(this.canvas);
        this.canvas.width = Graphics.width;
        this.canvas.height = Graphics.height;
		this.canvas.style.zIndex = 0;
		Graphics.canvas.style.zIndex = 1; // make the 2d canvas be on top of the 3d one.
        this.canvas.style.position = "absolute";
        document.body.appendChild(this.canvas);

		this.gl.viewport(0, 0, Graphics.width, Graphics.height);

		this.texture2 = new TextureGL(this.gl, 'rock'); //, Graphics.getImage('rock'));
		this.texture1 = new TextureGL(this.gl, 'noise2');

        this.canvas.style.width = Graphics.canvas.style.width;
        this.canvas.style.height = Graphics.canvas.style.height;
        this.canvas.style.left = Graphics.canvas.style.left;
        this.canvas.style.top = Graphics.canvas.style.top;
		//------------------------------------------------------------

		this.gui = new dat.GUI();

		this.scene = new Scene(this.gui);
		this.add(this.scene);

		//------------------------------------------------------------

		this.gl.enable(this.gl.BLEND); // remember to enable alpha minus one

		this.vertexShader = createShaderFromScriptElement(this.gl, "screen-vertex", null, this.onShaderError.bind(this));
		this.reloadShader();

		// Create a buffer and put a single clipspace rectangle in it (2 triangles)
		this.buffer = this.gl.createBuffer();
		this.vertices = new Float32Array([ -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]);
    },

	getElementText : function(shaderID)
	{
		var shaderScript = document.getElementById(shaderID);
		return shaderScript.text;
	},

	loadTokenizedShader : function(shaderID, variables)
	{
		var shaderText = this.getElementText(shaderID);

		for(var key in variables)
		{
			var v = variables[key];
			var reg = new RegExp(key, 'g');

            if(key.indexOf("_src_") === -1)
            {
                shaderText = shaderText.replace(reg, getValue(v)); // it is just a value
            }
            else
            {
                shaderText = shaderText.replace(reg, v); // it is a piece of source
            }
		}

		g_shaderSrc = shaderText;

		return loadShader(this.gl, shaderText, this.gl.FRAGMENT_SHADER, this.onShaderError.bind(this));
	},

	reloadShader : function()
	{
		this.fragmentShader = this.loadTokenizedShader("megatracer-frag", {
																			// globals
																			__width__: 				this.scene.width,
																			__height__: 			this.scene.height,
																			__rayRes__ : 			this.scene.rayRes,
																			__shadowRes__ : 		this.scene.shadowRes,
																			__aoRes__ : 			this.scene.aoRes,
																			__aoStrength__ : 		this.scene.aoStrength,

                                                                            __horizon_src__ :    	this.scene.getHorizonSrc(),

																			__lights_uniforms_src__:this.scene.getLightsUniforms(),
																			__lights_src__ :		this.scene.getLightsSrc(),
																			__lights_final_src__:	this.scene.getLightsFinalSrc()

																			// sky/background
																			// todo: add the missing stuff here
																		});

		this.program = createProgram(this.gl, [this.vertexShader, this.fragmentShader]);

	},

	onShaderError : function(msg)
	{
		console.log("ERROR IN SHADER: ", msg);
		console.log("----------------------------------------------\n\nShader src: ", g_shaderSrc);
		asd
	},

	addObject : function()
	{
		var obj = new Object3D(this.gui); // TODO: ADD THIS SHIT TO SOME ARRAY OF OBJECTS!!!
		var folderObj = new this.gui.addFolder("" + obj.id);
	},
	
	// basically: read an object of the form {name, type, value} and set the uniform. type can be for now:
	// 1f: single float
	// 3a: array of 3 floats [0, 1, 2]
	// 3v: vector of 3 floats {x, y, z}
	setUniformForObject : function(info)
	{	
		var location = this.gl.getUniformLocation(this.program, info.name);
		
		switch(info.type)
		{
			case '1f':
				this.gl.uniform1f(location, info.value);
			break;
			// todo: add 2's
			case '3a':
				this.gl.uniform3f(location, info.value[0], info.value[1], info.value[2]);
			break;
			case '3v':
				this.gl.uniform3f(location, info.value.x, info.value.y, info.value.z);
			break;
			
		}
	},
		
	// helper/wrapper for setting a shitload of values easily
	setUniformsFromMap : function(map)
	{	
		for(var i = 0; i < map.items.length; i++)
		{
			this.setUniformForObject(map.items[i]);
		}
	},
	
    update : function(delta)
    {
        this.callParent(delta);

        this.canvas.style.width     = Graphics.canvas.style.width;
        this.canvas.style.height    = Graphics.canvas.style.height;
        this.canvas.style.left      = Graphics.canvas.style.left;
        this.canvas.style.top       = Graphics.canvas.style.top;

		if(this.scene.shouldRecompile()) this.reloadShader();
    },

    draw : function()
    {
        this.callParent();

		// note: there are clearly issues with resizing!
		if(Core.pause)
		{
			this.gl.clearColor(0.1, 0.1, 0.1, 0.5)
			Graphics.drawFullScreenRect(0.0, 0.0, 0.0, 1.0);
			return;
		}

        //Graphics.drawText('Hello world!', 20, 315, 1, 1, 1, 1, 24, 'Arial'); // micron test. yes it works!

		// shader draw
		this.gl.useProgram(this.program);

		// look up where the vertex data needs to go.
		this.positionLocation = this.gl.getAttribLocation(this.program, "a_position");

		this.timeLocation = this.gl.getUniformLocation(this.program, "u_time");
		this.gl.uniform1f(this.timeLocation, Core.totalTime);

		// NOTE: all this shit could be optimized by sending a single uniform array with all the stuff inside!
		
		//--------------------------------------
		// camera - note: perhaps do the setUniformsFromMap thing for this too?????
        var camPosLocation = this.gl.getUniformLocation(this.program, "u_camPos");
		this.gl.uniform3f(camPosLocation, this.scene.cameraPosition.x, this.scene.cameraPosition.y, this.scene.cameraPosition.z);

        var camViewLocation = this.gl.getUniformLocation(this.program, "u_camView");
		this.gl.uniform3f(camViewLocation, this.scene.cameraView.x, this.scene.cameraView.y, this.scene.cameraView.z);

		var camFovLocation = this.gl.getUniformLocation(this.program, "u_camFov");
		this.gl.uniform1f(camFovLocation, this.scene.cameraFov);

		var sunPosLocation = this.gl.getUniformLocation(this.program, "u_sunPos");
		this.gl.uniform3f(sunPosLocation, this.scene.sunLightPos.x, this.scene.sunLightPos.y, this.scene.sunLightPos.z);

		//--------------------------------------
		// textures			
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture1.get());
		var texture1Location = this.gl.getUniformLocation(this.program, "u_texture1")
		this.gl.uniform1i(texture1Location, this.texture1.get());

		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture2.get());
		var texture2Location = this.gl.getUniformLocation(this.program, "u_texture2")
		this.gl.uniform1i(texture2Location, this.texture2.get());

		//--------------------------------------
		// lights		
		for(var i = 0; i < this.scene.lights.length; i++)
		{
			if(!this.scene.lights[i].isStatic && this.scene.lights[i].isEnabled && this.scene.lights[i].alive)
			{
				this.setUniformsFromMap(this.scene.lights[i].getUniforms());
			}
		}
		
		// todo: objects!		

		// finally, draw the frame
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(this.positionLocation);
		this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
	}



});

var StateGame = State.extend({

	bgr : null,
	tracer : null,

    constructor : function()
    {
        this.callParent();
        Camera.fade( {r:0, g:0, b:0, a:1}, {r:0, g:0, b:0, a:0}, 1);
    },

	init : function()
	{
		this.tracer = new Tracer();
		this.tracer.init();
		this.add(this.tracer);
	}
});

Core.init(APP_WIDTH, APP_HEIGHT);
Core.setState(new StateGame());
//Core.addAsset([	'rock', 'gfx/rock.jpg' ]); // NOPE. check the file "src/textures.js"
Core.loadAndRun();

