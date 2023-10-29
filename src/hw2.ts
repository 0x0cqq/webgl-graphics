import { mat4, vec3, vec4 } from 'gl-matrix';
import * as twgl from 'twgl.js';
import { Camera, CameraMovement } from './common/camera';

import negx from "./assets/negx.jpg";
import negy from "./assets/negy.jpg";
import negz from "./assets/negz.jpg";
import posx from "./assets/posx.jpg";
import posy from "./assets/posy.jpg";
import posz from "./assets/posz.jpg";


import { SkyBox } from './common/objects/skybox';
import { Cube } from './common/objects/cube';

import { FrameBufferExporter } from './common/frame_buffer';

function main() {
    // Get A WebGL context
    const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    // resize canvas to displaying size
    twgl.resizeCanvasToDisplaySize(canvas);

    if (!gl) {
        alert("No WebGL2! Please use a newer browser.");
        return;
    }

    // create a camera
    const camera = new Camera(vec3.fromValues(0.0, 0.0, 10.0));

    // catch scroll event to zoom in/out
    document.addEventListener('wheel', function (e) {
        camera.process_mouse_scroll(e.deltaY > 0 ? 1 : -1);
    });
    // catch key event to move camera
    document.addEventListener('keydown', function (e) {
        switch (e.key) {
            case 'w':
                camera.process_keyboard(CameraMovement.FORWARD, 0.1);
                break;
            case 's':
                camera.process_keyboard(CameraMovement.BACKWARD, 0.1);
                break;
            case 'a':
                camera.process_keyboard(CameraMovement.LEFT, 0.1);
                break;
            case 'd':
                camera.process_keyboard(CameraMovement.RIGHT, 0.1);
                break;
        }
    });
    // catch mouse down/up event to rotate camera
    let mouse_down = false, last_x = 0, last_y = 0;
    document.addEventListener('mousedown', function (e) {
        mouse_down = true;
        last_x = e.clientX;
        last_y = e.clientY;
    });
    document.addEventListener('mousemove', function (e) {
        if (!mouse_down) return;
        camera.process_mouse_movement(e.clientX - last_x, e.clientY - last_y);
        last_x = e.clientX;
        last_y = e.clientY;
    });
    document.addEventListener('mouseup', function (e) {
        mouse_down = false;
    });

    twgl.setDefaults({ attribPrefix: "a_" });



    // skybox texture
    const skyboxTexture = twgl.createTexture(gl, {
        target: gl.TEXTURE_CUBE_MAP,
        src: [
            posx, negx,
            posy, negy,
            posz, negz,
        ],
        min: gl.LINEAR_MIPMAP_LINEAR,
    });
    const skyboxObject = new SkyBox(gl, skyboxTexture);

    const cubeTexture = twgl.createTexture(gl, {
        min: gl.NEAREST,
        mag: gl.NEAREST,
        src: [
            255, 255, 255, 255,
            192, 192, 192, 255,
            192, 192, 192, 255,
            255, 255, 255, 255,
        ],
    });
    

    const cubeObject = new Cube(gl, vec3.fromValues(0.0, 0.0, 0.0), cubeTexture, vec3.fromValues(1, 0, 0));
    const cubeObject2 = new Cube(gl, vec3.fromValues(0.0, 1.0, 0.0), cubeTexture, vec3.fromValues(0, 1, 0));

    const objects = [skyboxObject, cubeObject, cubeObject2];
    
    const myFrameBuffer = twgl.createFramebufferInfo(gl);
    twgl.bindFramebufferInfo(gl, null);
    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if(status != gl.FRAMEBUFFER_COMPLETE){
      console.log("Invalid framebuffer");
    } else{
      console.log("Success creating framebuffer");
    }
    const myFrameBufferExporter = new FrameBufferExporter(gl, myFrameBuffer);


    // Draw the scene.
    function render(time: number) {
        time *= 0.001;  // convert to seconds

        // bind to framebuffer
        twgl.bindFramebufferInfo(gl, myFrameBuffer);
        
        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // turn on culling & depth test
        gl.enable(gl.DEPTH_TEST);

        // update cube position
        cubeObject.setPosition(vec3.fromValues(Math.cos(time) * 2.0, Math.sin(time) * 2.0, 0.0));


        // Render objects
        for (const object of objects) {
            object.render(camera, canvas);
        }

        // render framebuffer texture to screen
        twgl.bindFramebufferInfo(gl);
        myFrameBufferExporter.render(canvas)

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}



main();


