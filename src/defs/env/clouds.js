
var Clouds = GUIObject.extend({

    isEnabled : true,
    isStatic : true,
    color : null,
    far : 300.0, 
    strength : 0.88,
    min : 0.65,
    max : 0.3,
    seed : 0.009,

    constructor : function(gui)
    {
        this.color = [ 29, 22, 25 ];
        this.callParent(gui);
    },
    
    createGUI : function()
    {
		var tab = this.gui.addFolder("CLOUDS");

		tab.add(this, 'isEnabled', true).name("Enabled").onFinishChange( this.onPropertyChanged.bind(this) );
        tab.addColor(this, 'color').name("Color").onChange( this.onPropertyChanged.bind(this) );
        tab.add(this, 'far', 100.0, 2500.0).name("Far plane").onFinishChange( this.onPropertyChanged.bind(this) );                
        tab.add(this, 'strength', 0.0, 1.0).name("Strength").onFinishChange( this.onPropertyChanged.bind(this) );
        tab.add(this, 'min', 0.0, 1.0).name("Min").onFinishChange( this.onPropertyChanged.bind(this) );
        tab.add(this, 'max', 0.0, 1.0).name("Max").onFinishChange( this.onPropertyChanged.bind(this) );
        tab.add(this, 'seed' ,0.0, 0.01).name("Seed").onFinishChange( this.onPropertyChanged.bind(this) );
    },
    
    getSrc : function()
    {
        var src = '';
        
        if(this.isEnabled)
        {
            var r = getValue(this.color[0] / 255.0);
            var g = getValue(this.color[1] / 255.0);
            var b = getValue(this.color[2] / 255.0);
            var far = getValue(this.far);
            var strength = getValue(this.strength);
            var min = getValue(this.min);
            var max = getValue(this.max);
            var seed = getValue(this.seed);

            src += 'vec2 sc = ro.xz + rd.xz * ('+ far +'-ro.y) / rd.y;\n';
			src += 'col = mix( col, vec3('+ r +','+ g +','+ b +'), '+ strength +' * smoothstep('+ min +','+ max +',fbm('+ seed +' * sc)));\n';
        }
        
        return src;        
    }
        
});
