

var Sun = GUIObject.extend({

    isEnabled : true,
    isStatic : true,
    invSize : 5.0,
    strength : 0.5, // in sky!
    lightPos : null,
    color : null,

    constructor : function(gui)
    {
        this.lightPos = { x: -19.5, y: 3.5, z: -25.0 };    
        this.color = [ 255, 255, 255 ];
        this.callParent(gui);
    },
    
    createGUI : function()
    {
		var f = this.gui.addFolder("SUN");
		//sunStatic : true,
		//sunColor : null,
		//sunInvSize : 5.0,
		//sunStrength : 0.5, // IN SKY!
		//sunLightPos : null, // array NOTE: THIS SHIT SHOULD BE USED FOR THE MAIN SUNLIGHT POSITION AS WELL, OR SOMETHING!!!
		var sunHideController = f.add(this, 'hideShowSun').name("Hide/Show");
		
        var pos = f.addFolder("Position");
		pos.add(this.lightPos, 'x', -35.0, 35.0).onFinishChange( this.onPropertyChanged.bind(this) );
		pos.add(this.lightPos, 'y', -35.0, 35.0).listen().onFinishChange( this.onPropertyChanged.bind(this) );
		pos.add(this.lightPos, 'z', -35.0, 35.0).onFinishChange( this.onPropertyChanged.bind(this) );
    },
    
	hideShowSun : function()
	{
		if(this.lightPos.y > 0)
		{
			this.lightPos.y = -10.0;
		}
		else
		{
			this.lightPos.y = 3.5;
		}
	},
    
    getSrc : function()
    {
        
        
    }
        
});
