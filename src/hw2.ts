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

function main() {
    // Get A WebGL context
    const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;

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
    const cubeObject = new Cube(gl, vec3.fromValues(0.0, 0.0, 0.0));

    const objects = [skyboxObject, cubeObject];



    // Draw the scene.
    function render(time: number) {
        console.log(time);
        time *= 0.001;  // convert to seconds
        // resize canvas to displaying size
        twgl.resizeCanvasToDisplaySize(canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, canvas.width, canvas.height);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // turn on culling & depth test
        gl.enable(gl.DEPTH_TEST);


        cubeObject.setPosition(vec3.fromValues(Math.cos(time) * 2.0, Math.sin(time) * 2.0, 0.0));
        

        // Render objects
        objects.forEach((obj) => {
            obj.render(camera, canvas);
        });
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}



main();


