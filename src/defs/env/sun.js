

var Sun = GUIObject.extend({

    isEnabled : true,
    isStatic : true,
    invSize : 125.0,
    power : 2.5, // in sky!
    aperture : 0.01,
    intensity : 1.0, 
    attenMin : 0.955,
    attenMax : 0.987,
        
    lightPos : null,
    color : null,
    colorBac : null,
    colorBfl : null,    
    colorBce : null,
    colorSpe : null,
    
    // this should be encapsulated inside a flare object, but this is simpler and quickier for now
    flareEnabled : false,
    flareColor : null,
    flarePower : 1.0,
    flareDirtEnabled : false,
    flareDirtPower : 10.0,
    
    
    constructor : function(gui)
    {
        this.lightPos = { x: -19.5, y: 3.5, z: -25.0 };    
        //this.lightPos = { x: 0.0, y: 1.25, z: 0.0 };            
        this.color = [ 255, 115, 95 ];        
        this.colorBac = [ 188, 32, 22 ];
        this.colorBfl = [ 102, 12, 6 ];
        this.colorBce = [ 32, 32, 32 ];
        this.colorSpe = [ 8, 8, 8 ];
        this.flareColor = [ 255, 235, 232 ];
        this.callParent(gui);
    },
    
    createGUI : function()
    {
		var tab = this.gui.addFolder("SUN");
		var sunHideController = tab.add(this, 'hideShowSun').name("Hide/Show");
		tab.add(this, 'invSize', 1.0, 250.0).name("Inv. size (sky)").onFinishChange( this.onPropertyChanged.bind(this) );
		tab.add(this, 'power', 1.0, 15.0).name("Power (sky)").onFinishChange( this.onPropertyChanged.bind(this) );
		tab.add(this, 'aperture', 0.0, 1.0).name("Shadow Apert.").onFinishChange( this.onPropertyChanged.bind(this) );
		tab.add(this, 'intensity', 0.0, 50.0).name("Shadow Inten.").onFinishChange( this.onPropertyChanged.bind(this) );
    	tab.add(this, 'attenMin', 0.0, 1.0).name("Att. (min)").onFinishChange( this.onPropertyChanged.bind(this) );
		tab.add(this, 'attenMax', 0.0, 1.0).name("Att. (max)").onFinishChange( this.onPropertyChanged.bind(this) );              
        tab.addColor(this, 'color').name("Color").onChange( this.onPropertyChanged.bind(this) ); // diffuse
        tab.addColor(this, 'colorBac').name("Color Bac").onChange( this.onPropertyChanged.bind(this) );
        tab.addColor(this, 'colorBfl').name("Color Bfl").onChange( this.onPropertyChanged.bind(this) );
        tab.addColor(this, 'colorBce').name("Color Bce").onChange( this.onPropertyChanged.bind(this) );
        tab.addColor(this, 'colorSpe').name("Color Spe").onChange( this.onPropertyChanged.bind(this) );
        
        var pos = tab.addFolder("Position");
		pos.add(this.lightPos, 'x', -35.0, 35.0).onFinishChange( this.onPropertyChanged.bind(this) );
		pos.add(this.lightPos, 'y', -35.0, 35.0).onFinishChange( this.onPropertyChanged.bind(this) ); // listen()
		pos.add(this.lightPos, 'z', -35.0, 35.0).onFinishChange( this.onPropertyChanged.bind(this) );
    },
    
	hideShowSun : function()
	{
		if(this.lightPos.y > 0)
		{
			this.lightPos.y = -35.0;
		}
		else
		{
			this.lightPos.y = 3.5;
		}
	},
    
    getSrc : function()
    {
        var src = '';
        
        var r = getValue(this.color[0] / 255.0);
        var g = getValue(this.color[1] / 255.0);
        var b = getValue(this.color[2] / 255.0);        
        var power = getValue(this.power);
        var invSize = getValue(this.invSize);
        
        //if(this.enabled) // todo
		src += 'float sundot = clamp(dot(rd, normalize(u_sunPos)), 0.0, 1.0);';
		src += 'col += '+ power +' * vec3('+ r +', '+ g +', '+ b +') * pow( sundot, '+ invSize +' );\n';  // 1. power. 2. color. 3. size.                    
        
        return src;
    },

    getDifSrc : function()
    {
        return getVector3Array(this.color);
    },
    
    getBacSrc : function()
    {
        return getVector3Array(this.colorBac);
    },

    getBflSrc : function()
    {
        return getVector3Array(this.colorBfl);
    },

    getBceSrc : function()
    {
        return getVector3Array(this.colorBce);
    },
    
    getSpeSrc : function()
    {
        return getVector3Array(this.colorSpe);
    },
        
    getFlareFuncSrc : function()
    {
        
        
    },
    
    getFlareSrc : function()
    {
        
        
    }
        
});
