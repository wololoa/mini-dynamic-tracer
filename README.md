# Mini Dynamic Tracer

a.k.a "Single shader, distance field raytracer based dynamic renderer".

# What

A kinda small experiment in the area of dynamic GPU-only, real time raytracer renderers using WebGL.

In short: a 3d renderer built on top of [micronjs](http://micronjs.github.io/) which has (in 1 single shader):

* a fully fledged distance field raytracer.
* a lot of primitive objects.
* several light types (direct sun light with shadow casting + point lights + area lights + ambient occlusion).
* lots of environmental possibilities (sky + sun + clouds + fog).
* lots of "postprocessing"/screenspace effects (gamma correction, lensflare, vignetting, tone mapping, desaturation and many others).
* flexible material system for different types of surfaces.
* ... and more!

Most of this is based on the awesome work of Iñigo Quilez (specially [this](http://iquilezles.org/www/articles/distfunctions/distfunctions.htm) and [this](https://www.shadertoy.com/view/ldl3zl)).

# Why

Check the file "about" to know what is going on here.

# FAQ

* Q. What is actually dynamic here?
The entire renderer fits in one single shader, which is recompiled based on what is used in the scene. The system is flexible enough that in the future it would be possible to change the actual renderer entirely (to a pathtracer for example). Instead of writing a huge thing and use a single shader for each surface/effect, this one has all. And nope, this is not an übershader.

* Q. Why to create a mini editor?
Writing shaders is fun, but time consuming. Having an small editor is the best way to test all features and check the strengths and weakness of the system. Also, it is good to create good looking things :)

* Q. Why there is no online editor yet?
There will be soon!

* Q. Is this good enough to make games?
It depends. For simple scenes, the answer is yes. In most computers, the performance should be acceptable. For bigger things, definitely not. This is more a proof of concept rather than a fully fledged renderer. You can create good looking scenes for sure for visualization or tests, but you will not be able to compete with any current game. There are too objects nowadays to fit in a single shader. With WebGL2 this will be partially mitigated thanks to uniform buffers: it would be possible to move way more data to the GPU and have more objects, but there is a pretty big bottleneck right now with this system: the more objects you have, the more has to be calculated. Doing occlusion queries on the CPU side and create in the shader only the objects that will be needed will help, but I'm not sure we will manage to see something as complex as a GTA game for example. Not yet. Maybe. We'll see.

# Who

(c) Almar. 2015. Check the license.
