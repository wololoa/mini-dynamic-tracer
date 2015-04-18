
/*
 * A simple point light object:
 * - position
 * - size
 * - color
 * - intensity
 * - specular power
 */
var PointLight = GUIObject.extend({

	alive : true, // hack to know if the object exists on the UI side. shitty. I know.
	id : 0,
	isStatic : true,
	isEnabled : true,
	position : null,
	color : null,
	size : 1.0,
	intensity : 1.0,
	specPower : 1.0,
    //uniforms : null,
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
		var tab = this.gui.addFolder("PointLight " + this.id); // todo> make function "get name"
		tab.add(this, 'isStatic').name('Static').onFinishChange( this.onPropertyChanged.bind(this) );
		tab.add(this, 'isEnabled').name('Enabled').onFinishChange( this.onPropertyChanged.bind(this) );

		var pos = tab.addFolder("Transform");
		pos.add(this.position, 'x', -15.0, 15.0).onFinishChange( this.onPropertyChanged.bind(this) );
		pos.add(this.position, 'y', -15.0, 15.0).onFinishChange( this.onPropertyChanged.bind(this) );
		pos.add(this.position, 'z', -15.0, 15.0).onFinishChange( this.onPropertyChanged.bind(this) );

		tab.add(this, 'size', 0.0, 10.0).name('Size').onFinishChange( this.onPropertyChanged.bind(this) );
		tab.add(this, 'intensity').name('Intensity').onFinishChange( this.onPropertyChanged.bind(this) );
		tab.add(this, 'specPower').name('Spec. Power').onFinishChange( this.onPropertyChanged.bind(this) );
		tab.addColor(this, 'color').name('Color').onFinishChange( this.onPropertyChanged.bind(this) );

		var controller = tab.add(this, 'removeGUI').name('Delete');
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
