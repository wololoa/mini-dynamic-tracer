# About "Mini Dynamic Tracer"

* Summary

What you can see here is basically an experiment on several things.

First, this tries to push the state of real time raytracing (raymarching would be more accurate) using distance fields. There are a lot of good shaders out there (check [shadertoy](https://www.shadertoy.com/)) and also a general increase in commercial tools using path/raytracers for production of high quality images for architectural visualization. However, I haven't seen yet this tools to provide a game-specific renderer of this kind. Perhaps my google skills are not good enough.

Second, while there are more tools than ever to make good looking things (Unreal Engine, Unity, etc), the amount of work that someone has to put to create the renderers of such engines (dynamic global illumination, I'm looking at you!) with the level of detail that they have is a bit too much. Renderers are becoming more and more complex, things are difficult to understand and take a long long time to code. And because of the natural evolution of realtime rendering (rasterize a lot of polygons using shaders to fake properties of surfaces and apply a shitload of postprocessing to make it look good - and now I'm looking at you, The Order: 1886!), in order to have natural/physical accurate lighting, a lot of hacks have to be made. Realtime, AAA quality graphic programming is now more a shit-ton of hacks over hacks than anything else, and a huge amount of effort goes into making this hacks to work properly to bring "physical" properties to polygon-based-renderers. It would be nice for a change to make an extremely simple renderer with simple objects to display high quality images using a minimal amount of hacks on the renderer side, and this is what the mini tracer is all about.

Last but not least, considering that renderers are big beasts, it is not trivial to make them "dynamic", and by dynamic I mean "create a custom tailored shader that will contain only what is needed, and change each part like the pieces of a car engine". You don't like the way to calculate point lights? Change it. Need more primitives? Done. Another materials? Add them. More post processing? Sure. Change completely the tracer to do something else? This is a bit more tricky, but why not! The main goal is to dynamically create the renderer using only what is needed to display the current scene. No more, no less. The typical "classic" renderer approach makes this very difficult. Having the entire renderer in a single shader makes it very easy to understand, tweak, extend and change the system. And this is definitely doable by a single man during his spare hours!

* How

On the "cpu" side, we have several basic objects:

> Object3d

Self descriptive I guess. This can be any primitive: a cube, an sphere, a torus. Primitives can be joined, blended, twisted and intersected with other primitives to create complex shapes. 

These objects do not only have the information of a shape and transform, but also the material they have.

> PointLight

A basic point light source, which casts no shadows. Pretty basic stuff.

> AreaLight

Instead of a point casting light, imagine an entire surface. This is somehow limited right now.

> SunLight

A single, all-powerful, sun-alike, shadow-casting source of light. Nice.

> Scene

A bunch of stats (global stuff for the renderer - like the scene size/resolution, ray resolution, etc -, environment, postprocessing effects, etc). This also holds all objects and lights inside.

And... this is pretty much it. Each object has a bunch of helper functions (to return the code or uniforms that must be sent to the shader), but in general, they are simple data containers. A PointLight is just a position (vec3), color (vec3) a size (float) and intensity (float). We could add more values later (like penumbra/specular value, etc) but this is enough for now. Objects are a bit more complex, but follow the same rule: they are containers of data, a bunch of uniforms and that's it.

On the "gpu" side however, we have a lot more stuff:

> The tracer

A distance field raymarcher with variable step size. This needs several things:

- a main "render" function that will calculate the final "color" for each pixel and "shade" it.
- a "color" function that will calculate the color of each pixel. Here we use the material of each "object", and we know which object is being rendered by using a "map" function.
- a "map" function which calculates which is the object rendered in this pixel.
- a "shade" function which will compose the final color + the light received from the ambient ("ambient occlusion"), direct lighting, other light sources and (when enabled) indirect light from the reflected rays on the scene.

The map function inside has to calculate the "distance" for each object. This is done using the mathematical distance functions for each primitive and its modifiers (union, intersection, blend, twist, etc).

> The shader 

Besides having all the above things in there, the final renderer looks like a single simple GLSL shader with two types of "variables" inside: values and source. Values are directly written in the source (numbers, basically) while source is an string of text replaced on the shader. At the end, a final GPU-compilable fragment shader is created which is dynamically recompiled when the scene requires it.

# Limitations

Considering that the entire scene is described inside a single shader (together with the primitive functions for it, the materials, the raymarcher and the postprocessing), there are a lot of limitations. 

> 1. The amount of objects. 
In order to draw them, the "map" function must calculate the distance to all of them, even when they are not visible. This could be improved by sending only the information of the objects that are actually seen. However there are a few things that must be hardcoded yet. Also, recompiling the shader is not ready for "realtime use", which means it is not possible to regenerate the scene each frame.

> 2. The amount of data sent from the CPU.
While 1024 float uniform values seems a lot, when you start calculating the amount of info that you must send per object, you end up seeing that it is not much. If all objects could be described with 12 float values (which is not possible, even simplifying the transform), we could have just 84 objects + 16 values for other elements (camera, etc). This is not enough. Uniform buffers will help a lot here.

> 3. The amount of textures sent to the GPU.
This is directly related with the above point. Right now, most GPU's should be able to hold up to 16 textures (ok, maybe 32, but you know: let's play safe). This is extremely limited. We could of course use the maximum texture size (which goes up to 16k, more or less) to increase this a bit (we can see 16 textures as a 4x4 matrix, each element being 16k would give us a final atlas of 64x64k which is acceptable) and go for a solution "alla id tech 5" which could be enough, but sadly this means that additional UV information would have to be sent per each object. Which adds more overhead to the point above.

> 4. The amount of instructions on the shader.
This is perhaps the biggest "deal breaker". The amount of instructions that you can put on a shader is sadly finite. And we are not talking about "a few thousand lines", in most cases 500 lines is enough to kill it. Obviously this depends on your hardware and how you code it, but this means that eventually you will ran out of instructions. Even if performance would hold tight, the shader would not compile. The worst part is that this is dependant on several factors, and it is not quite easy to know when you will hit the end. You know when the shader crashes :)

# Pros and cons

Personally, I'm kinda happy with this. The final look of scenes is pretty good. The biggest issue when making good looking things for a programmer comes when you have to do your 3d art. Using simple primitives means that you can just build with very very simple blocks and spend most of your time tweaking parameters. However, there are a lot of things that need to be polished if this is ever used for a finished product.

> Pros

- no need to do modelling or texturing. Just put a bunch of objects together.
- what you see is what you get: there is no delay when rendering the scenes. This is the definitive real-time raytracer. Most solutions out there require you to wait for a while when rendering or always see a blurry/noisy image all the time and wait for the final render. This is the real deal, all the time. Even when you change "static" values that require a full shader regeneration, you never have to wait more than a few seconds. And after that, you go back to your 30/60 fps. And moving around the scene comes with zero penalty. Yikes!
- good looking, AAA quality in a mini renderer. I love when small things accomplish big results.
- no faking, no hacks. Shadows are casted, reflections as well. Materials include what you expect from them - from flat shaded to bump mapping to volumetric fx. Again: there are no hacks here.
- all included. Everything is there and you can read the entire code in one file. You don't have to reverse engineer complex structures nor do mental yoga to fit the code in your head. On the CPU side, there are less than 5 classes, each one describing a single object. It cannot get simpler than this.

> Cons

- difficult for "real life artists". They will not have direct control over the objects, primitives and procedural shapes cannot compete with hand-made models. Also, no UV mapping for now.
- limited. From the number of objects to the number of textures used: everything is limited. Forget making the next GTA with this. Also: limited shader size.
- potentially bad performance. Old hardware will choke if your resolution is big enough or if your constants are too big (not all hardware can throw 128 rays per pixel and continue keeping a happy 60 fps).
- no anti-aliasing. Sadly this kills a bit the final result.
- cannot compete with current "polygon rasterizers". And probably, cannot compete with any other commercial path/raytracers. But hey, this is just an experiment ;)
