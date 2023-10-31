import { mat4, vec2, vec3, vec4 } from 'gl-matrix';
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
import { CollisionTest } from './common/collision_test';

import { ConfigData, ConfigReader } from './common/config';
import { Ball } from './common/objects/ball';
import { BasicObject } from './common/objects/basic_object';


function main() {
    // Get A WebGL context
    const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    const config_reader = new ConfigReader(gl);
    // resize canvas to displaying size
    twgl.resizeCanvasToDisplaySize(canvas);

    if (!gl) {
        alert("No WebGL2! Please use a newer browser.");
        return;
    }


    // create a camera
    const camera = new Camera(vec3.fromValues(0.0, 0.0, 15.0));

    // catch scroll event to zoom in/out
    document.addEventListener('wheel', function (e) {
        camera.process_mouse_scroll(e.deltaY > 0 ? 1 : -1);
        fresh_camera_info_string();
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
            case 'q':
                camera.process_keyboard(CameraMovement.UP, 0.1);
                break;
            case 'e':
                camera.process_keyboard(CameraMovement.DOWN, 0.1);
                break;
        }
        fresh_camera_info_string();
    });
    // catch mouse down/up event to rotate camera
    let mouse_down = false, last_x = 0, last_y = 0;
    canvas.addEventListener('mousedown', function (e) {
        mouse_down = true;
        last_x = e.clientX;
        last_y = e.clientY;
    });
    canvas.addEventListener('mousemove', function (e) {
        if (!mouse_down) return;
        camera.process_mouse_movement(e.clientX - last_x, e.clientY - last_y);
        fresh_camera_info_string();
        last_x = e.clientX;
        last_y = e.clientY;
    });
    canvas.addEventListener('mouseup', function (e) {
        mouse_down = false;
    });
    canvas.addEventListener('mouseleave', function (e) {
        mouse_down = false;
    });

    function fresh_camera_info_string() {
        const position_element = document.querySelector("#camera_pos") as HTMLSpanElement;
        const angle_element = document.querySelector("#camera_angle") as HTMLSpanElement;
        const zoom_element = document.querySelector("#camera_zoom") as HTMLSpanElement;
        position_element.innerText = camera.get_position_string();
        angle_element.innerText = camera.get_angles_string();
        zoom_element.innerText = camera.get_zoom_string();
    }

    fresh_camera_info_string();

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
    

    const cubeObject = new Cube(gl, vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(3.0, 2.0, 0.0), 1, vec3.fromValues(1, 0, 0), true, cubeTexture);
    const cubeObject2 = new Cube(gl, vec3.fromValues(3.0, 0.0, 0.0), vec3.fromValues(0.0, 0.0, 0.0), 0.5, vec3.fromValues(0, 0, 1), false, cubeTexture);
    const ballObject1 = new Ball(gl, vec3.fromValues(0.0, 3.0, 0.0), vec3.fromValues(0.0, 2.0, 0.0), 1.5, vec3.fromValues(0, 1, 0), true);
    const ballObject2 = new Ball(gl, vec3.fromValues(0.0, 0.0, -2.0), vec3.fromValues(0.0, 0.0, 0.0), 1, vec3.fromValues(0, 1, 0), false);

    let objects : BasicObject[] = [cubeObject, cubeObject2, ballObject1, ballObject2];
    
    // create a framebuffer
    const myFrameBuffer = twgl.createFramebufferInfo(gl);
    twgl.bindFramebufferInfo(gl, null);
    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if(status != gl.FRAMEBUFFER_COMPLETE){
      console.log("Invalid framebuffer");
    } else{
      console.log("Success creating framebuffer");
    }
    
    const myFrameBufferExporter = new FrameBufferExporter(gl, myFrameBuffer);

    // find the filter element
    const filter = document.querySelector("#filter") as HTMLSelectElement;

    // create a listener to change the filter in the framebuffer
    filter.addEventListener('change', function (e: Event) {
        let index = this.options.selectedIndex;
        let value = this.options[index].value;
        console.log(value);
        myFrameBufferExporter.recreate(parseInt(value));
    });


    // create a collision detector
    const boundaries = [
        vec2.fromValues(-5, 5),
        vec2.fromValues(-5, 5),
        vec2.fromValues(-5, 5),
    ];
    const collision_output = document.querySelector("#collision_output") as HTMLTextAreaElement;
    function addCollisionOutput(s: string) {
        collision_output.value = s + '\n' + collision_output.value;
    }

    const myCollisionDetector = new CollisionTest(boundaries, addCollisionOutput);

    myCollisionDetector.addObject(cubeObject);
    myCollisionDetector.addObject(cubeObject2);
    myCollisionDetector.addObject(ballObject1);
    myCollisionDetector.addObject(ballObject2);


    const config_button = document.querySelector("#load_config") as HTMLButtonElement;
    const config_file_input = document.querySelector("#config") as HTMLInputElement;

    config_button.addEventListener('click', function (e) {
        if(config_file_input.files == null) {
            return;
        }
        if(config_file_input.files.length == 0) {
            alert("Please select a config file");
            return;
        }
        const config_file = config_file_input.files[0];
        config_reader.load(config_file).then((config_data: ConfigData) => {
            config_reader.set_camera(config_data.camera, camera);
            config_reader.set_boundary(config_data.boundary, myCollisionDetector);
            objects = config_reader.set_objects(config_data.objects, myCollisionDetector);
            console.log(config_data.objects)
            myFrameBufferExporter.recreate();
        });
    });
    const x_pos = document.querySelector("#button_x_pos") as HTMLButtonElement;
    const x_neg = document.querySelector("#button_x_neg") as HTMLButtonElement;
    const z_pos = document.querySelector("#button_z_pos") as HTMLButtonElement;
    const z_neg = document.querySelector("#button_z_neg") as HTMLButtonElement;

    x_pos.addEventListener('click', function (e) {
        camera.set_position(vec3.fromValues(15.0, 0.0, 0.0));
        camera.set_yaw_pitch(180, 0);
        fresh_camera_info_string();
    });

    x_neg.addEventListener('click', function (e) {
        camera.set_position(vec3.fromValues(-15.0, 0.0, 0.0));
        camera.set_yaw_pitch(0, 0);
        fresh_camera_info_string();
    });

    z_pos.addEventListener('click', function (e) {
        camera.set_position(vec3.fromValues(0.0, 0.0, 15.0));
        camera.set_yaw_pitch(-90, 0);
        fresh_camera_info_string();
    });

    z_neg.addEventListener('click', function (e) {
        camera.set_position(vec3.fromValues(0.0, 0.0, -15.0));
        camera.set_yaw_pitch(90, 0);
        fresh_camera_info_string();
    });


    let last_time = 0;

    // Draw the scene.
    function render(time: number) {
        time *= 0.001;  // convert to seconds

        if(last_time != 0) {
            const deltaTime = time - last_time;
            // update cube position
            myCollisionDetector.updatePosition(deltaTime);
        }
        last_time = time;

        // bind to framebuffer
        twgl.bindFramebufferInfo(gl, myFrameBuffer);
        
        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // turn on culling & depth test
        gl.enable(gl.DEPTH_TEST);

        // detect collision 
        myCollisionDetector.detectCollision();

        // render skybox
        skyboxObject.render(camera, canvas);
        
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


