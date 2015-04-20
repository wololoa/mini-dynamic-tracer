

/*
 * The scene encapsulates all the object-cpu side of the engine.
 * It contains all the configuration parameters + objects and lights.
 */
// TODO: move each subsection to its separated object
// TODO: save to storage the last thing you did! all the parameters!
var Scene = GUIObject.extend({

	// ---------- GLOBALS ----------
    // TODO: SCENE PRESETS!!! (like cornel, empty, etc)
	// TODO: LOAD AND SAVE SCENE!
	width : APP_WIDTH,
	height : APP_HEIGHT,
	rayRes : 64.0,
	shadowRes : 24.0,
	aoRes : 6.0,
	aoStrength : 8.0,
    reflEnabled : false,
    reflRes : 2.0,
    
	// ---------- CAMERA ----------
	cameraPosition : null,
	cameraView : null,
	cameraSpeed : 4.0,
	cameraFov : 2.0,

	// ---------- ENVIRONMENT ----------
	//isEnvEnabled : true, // set to false to fuck it all :D
	bgrColor : null,

	// TODO> ADD TERRAIN!!!!!!!!!!!!!!!!
    
    sun : null,
    horizon : null,
    clouds : null,
    fog : null,
    
	// TODO> MOON???????

	// ---------- POSTPROCESSING ----------
	// gamma correction
	gammaEnabled : true,
	gammaAmount : 0.35,

	// todo> tonemapping????
	// todo> FILMIC GRAIN! (the order forthefuck)
	// todo> LENS FUCKIN' FLARE! - dirty texture, intensity, enabled - use the sun color!. extra: apocalypse fx

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
		this.bgrColor = [ 128, 128, 196 ];
		//this.sunLightPos = { x: -19.5, y: 3.5, z: -25.0 };
		this.cameraPosition = { x: 0.9, y: 0.3, z: 1.5 };
		this.cameraView = {x: 0.0, y: 0.2, z: 0.1 };
        this.lights = [];
		this.callParent(gui);
	},

	createGUI : function()
	{

		var addLightController = this.gui.add(this, 'addPointLight').name('Add point light');		
		addLightController.onFinishChange( this.onPropertyChanged.bind(this) );

		var showShaderController = this.gui.add(this, 'printShader').name('Debug print shader');		
		
		var tab = this.gui.addFolder("GLOBALS");
		tab.add(this, 'width', 240, 1920).name("Width").onFinishChange( this.onPropertyChanged.bind(this) );
		tab.add(this, 'height', 120, 1920).name("Height").onFinishChange( this.onPropertyChanged.bind(this) );
		tab.add(this, 'rayRes', 1.0, 256.0).name("Ray resolution").onFinishChange( this.onPropertyChanged.bind(this) );
		tab.add(this, 'shadowRes', 1.0, 128.0).name("Softshadow res").onFinishChange( this.onPropertyChanged.bind(this) );
		tab.add(this, 'aoRes', 1.0, 128.0).name("AO res").onFinishChange( this.onPropertyChanged.bind(this) );
		tab.add(this, 'aoStrength', 0.0, 50.0).name("AO strength").onFinishChange( this.onPropertyChanged.bind(this) );
        tab.add(this, 'reflEnabled').name("Refl. enabled").onFinishChange( this.onPropertyChanged.bind(this) );
        tab.add(this, 'reflRes', 1.0, 64.0).name("Refl. resolution").onFinishChange( this.onPropertyChanged.bind(this) );
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


		var folderEnv = this.gui.addFolder("ENVIRONMENT");
		//folderEnv.add(this, 'isEnvEnabled', true).name("Enabled").onFinishChange( this.onPropertyChanged.bind(this) );
		folderEnv.addColor(this, 'bgrColor').name("Background").onChange( this.onPropertyChanged.bind(this) ); // onFinishChange
        
        
        
        this.sun = new Sun(folderEnv);
        this.horizon = new Horizon(folderEnv);
        this.clouds = new Clouds(folderEnv);
        this.fog = new Fog(folderEnv);

        
		//var f32 = f3.addFolder("CLOUDS");
		//this.addPointLight();
        //this.recompile = true;
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
			ret = this.recompile || this.sun.shouldRecompile() || this.horizon.shouldRecompile() || this.clouds.shouldRecompile() || this.fog.shouldRecompile();
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
    getBgrSrc : function()
    {
		var r = getValue(this.bgrColor[0] / 255.0);
		var g = getValue(this.bgrColor[1] / 255.0);
		var b = getValue(this.bgrColor[2] / 255.0);        
        
        var src = 'col = vec3('+ r +','+ g +','+ b +')*(1.0-0.8*rd.y);';
        return src;
    },

    getReflEnabledSrc : function()
    {
        var src = '';
        if(this.reflEnabled)
        {
            src = '			#define USE_REFLECTIONS';
        }
        return src;
    },
    
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
	}

    // environment

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
