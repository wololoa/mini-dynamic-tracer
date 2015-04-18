

var Horizon = GUIObject.extend({

	isEnabled : true,
	isStatic : true,
	color : null,
	gradient : 8.0,
	size : 0.10,

    constructor : function(gui)
    {
        this.color = [ 255, 255, 255 ];
        this.callParent(gui);
    },
    
    createGUI : function()
    {               
		var tab = this.gui.addFolder("HORIZON");
		tab.add(this, 'isEnabled', true).name("Enabled").onFinishChange( this.onPropertyChanged.bind(this) );
		//f33.add(this, 'horizonStatic', true); // TODO!
        tab.addColor(this, 'color').name("Color").onChange( this.onPropertyChanged.bind(this) );
        tab.add(this, 'gradient', 0.0, 16.0).name("Size").onFinishChange( this.onPropertyChanged.bind(this) );
        tab.add(this, 'size', 0.0, 1.0).name("Strength").onFinishChange( this.onPropertyChanged.bind(this) );
		//tab.open();       
    },
    
    getSrc : function()
    {
        var src = '';

        // TODO: make this dynamic!
		// horizonStatic : true,
        if(this.isEnabled)
        {
        	var r = getValue(this.color[0] / 255.0);
            var g = getValue(this.color[1] / 255.0);
            var b = getValue(this.color[2] / 255.0);
            src = 'col = mix( col, vec3('+ r +','+ g +','+ b +'), pow( 1.0 - max(rd.y,'+ getValue(this.size) +'), '+ getValue(this.gradient) +') );';
        }
        return src;
    }        
        
});
