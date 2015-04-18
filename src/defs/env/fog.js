
var Fog = GUIObject.extend({

    isEnabled : false,
    isStatic : true,
    color : null,
    strength : 2.0, 
    near : 0.01,

    constructor : function(gui)
    {
        this.color = [ 64, 64, 64 ];
        this.callParent(gui);
    },
    
    createGUI : function()
    {
		var tab = this.gui.addFolder("FOG");

		tab.add(this, 'isEnabled', true).name("Enabled").onFinishChange( this.onPropertyChanged.bind(this) );
        tab.addColor(this, 'color').name("Color").onChange( this.onPropertyChanged.bind(this) );
        tab.add(this, 'strength', 0.0, 4.0).name("Strength").onFinishChange( this.onPropertyChanged.bind(this) );
        tab.add(this, 'near', 0.0, 1.0).name("Near plane").onFinishChange( this.onPropertyChanged.bind(this) );        
    },
    
    getSrc : function()
    {
        var src = '';
        
        if(this.isEnabled)
        {
            var r = getValue(this.color[0] / 255.0);
            var g = getValue(this.color[1] / 255.0);
            var b = getValue(this.color[2] / 255.0);
            var power = getValue(this.strength);
            var nearPlane = getValue(this.near);
            
            src += 'vec3 fog = vec3('+ r +', '+ g +', '+ b +') * '+ power +';\n';
            src += 'float v = 1.0 - pow(distance(q, vec2(0.5)), 1.0);\n';
            src += 'col = 1.5 * mix(fog, col, exp(-t * t * '+ nearPlane +')) * v;\n';       
        }
        
        return src;        
    }
        
});
