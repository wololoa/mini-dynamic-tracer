
/*
 * A simple object, which is composed by one primitive (note: perhaps more?), a material, some distortion (blend, twist, etc) 
 * and a boolean operation (union, intersection, etc).
 */
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
