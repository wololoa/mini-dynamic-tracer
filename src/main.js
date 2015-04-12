
// TODO: add something (like  *) close to the variables that are ALWAYS static

// sdCube todo: FUNCTIONS
// todo: MATERIALS

var StateGame = State.extend({

	bgr : null,
	tracer : null,

    constructor : function()
    {
        this.callParent();
        Camera.fade( {r:0, g:0, b:0, a:1}, {r:0, g:0, b:0, a:0}, 1);
    },

	init : function()
	{
		this.tracer = new Tracer();
		this.tracer.init();
		this.add(this.tracer);
	}
});

Core.init(APP_WIDTH, APP_HEIGHT);
Core.setState(new StateGame());
//Core.addAsset([	'rock', 'gfx/rock.jpg' ]); // NOPE. check the file "src/textures.js"
Core.loadAndRun();

