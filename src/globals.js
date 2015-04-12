
var APP_WIDTH           = 840;
var APP_HEIGHT          = 480;
var APP_SCALE			= 1.4; // you will likely have to change this, sorry  :(
var GLOBAL_OBJ_ID       = 0;
var GLOBAL_LIGHT_ID     = 0;
var g_shaderSrc 		= ""; // global var for simplicity. yep.

function getValue(v)
{
	var number = v;
	return isNaN(number) ? 0.0 : number.toFixed(4); // NaN bug fix
}
