
var Tracer = Entity.extend({

	canvas : null,
	gl : null,
	vertexShader : null,
	fragmentShader : null,
	vertices : null,
	program : null,
	buffer : null,
	texture1 : null, // change to "textures" array/map!!!
	texture2 : null,
    textureFlare : null,
    compilationSucceeded : false,

	gui : null,
	scene : null,
    errorMsg : "",

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

        this.textureFlare = new TextureGL(this.gl, 'lensFlare');               
		this.texture2 = new TextureGL(this.gl, 'rock'); //, Graphics.getImage('rock'));
		this.texture1 = new TextureGL(this.gl, 'noise3');
        
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
        this.compilationSucceeded = true;
        this.errorMsg = "";

		this.fragmentShader = this.loadTokenizedShader("megatracer-frag", {
																			// globals
																			__width__: 				this.scene.width,
																			__height__: 			this.scene.height,
																			__rayRes__ : 			this.scene.rayRes,
																			__shadowRes__ : 		this.scene.shadowRes,
																			__aoRes__ : 			this.scene.aoRes,
																			__aoStrength__ : 		this.scene.aoStrength,
                                                                            __reflEnabled_src__:    this.scene.getReflEnabledSrc(),
                                                                            __reflRes__:            this.scene.reflRes,

                                                                            __bgr_src__:            this.scene.getBgrSrc(),
                                                                            __horizon_src__ :    	this.scene.horizon.getSrc(),
                                                                            __clouds_src__:         this.scene.clouds.getSrc(),
                                                                            __fog_src__:            this.scene.fog.getSrc(),

																			__lights_uniforms_src__:this.scene.getLightsUniforms(),
																			__lights_src__ :		this.scene.getLightsSrc(),
																			__lights_final_src__:	this.scene.getLightsFinalSrc()

																			// sky/background
																			// todo: add the missing stuff here
																		});

        if(this.compilationSucceeded)
        {
            this.program = createProgram(this.gl, [this.vertexShader, this.fragmentShader]);
        }
	},

	onShaderError : function(msg)
	{
		console.log("ERROR IN SHADER: ", msg);
		console.log("----------------------------------------------\n\nShader src: ", g_shaderSrc);
		this.compilationSucceeded = false;
        this.errorMsg = msg;
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

		Graphics.reposition(0, 0);
		Graphics.rescale(Graphics.width * APP_SCALE, Graphics.height * APP_SCALE);
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

        // the micron canvas is on top of the webgl one, so it doesn't really matter where we put this.
        if(this.errorMsg !== "")
        {
            Graphics.drawText(this.errorMsg, 10, 10, 1, 0, 0, 1, 12, 'Arial');
        }

        // no shader no fun
        if(!this.compilationSucceeded) return;

		// shader draw
		this.gl.useProgram(this.program);

		// look up where the vertex data needs to go.
		var positionLocation = this.gl.getAttribLocation(this.program, "a_position");

		var timeLocation = this.gl.getUniformLocation(this.program, "u_time");
		this.gl.uniform1f(timeLocation, Core.totalTime);

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
		this.gl.uniform3f(sunPosLocation, this.scene.sun.lightPos.x, this.scene.sun.lightPos.y, this.scene.sun.lightPos.z);

		//--------------------------------------
		// textures               
		var texture1Location = this.gl.getUniformLocation(this.program, "u_texture1")
		this.gl.uniform1i(texture1Location, 0); //this.texture1.get());
        this.gl.activeTexture(this.gl.TEXTURE0);        
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture1.get());
       
		var texture2Location = this.gl.getUniformLocation(this.program, "u_texture2")
		this.gl.uniform1i(texture2Location, 1); //this.texture2.get());        
        this.gl.activeTexture(this.gl.TEXTURE1);                
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture2.get());

		var textureFlareLocation = this.gl.getUniformLocation(this.program, "u_textureFlare")
		this.gl.uniform1i(textureFlareLocation, 2); //this.textureFlare.get());       
        this.gl.activeTexture(this.gl.TEXTURE2);                
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textureFlare.get());
        
        
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
		this.gl.enableVertexAttribArray(positionLocation);
		this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
	}

});

