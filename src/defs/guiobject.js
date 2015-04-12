
// A simple wrapper for GUI
// If you want to use the engine without the gui, removing all the gui related stuff from the classes is pretty simple - 
// just don't extend this, remove the overriden createGUI functions and you are done.
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
