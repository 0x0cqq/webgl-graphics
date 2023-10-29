import { mat4, vec3, vec4 } from 'gl-matrix';
import * as twgl from 'twgl.js';
import { Camera, CameraMovement } from './common/camera';

import negx from "./assets/negx.jpg";
import negy from "./assets/negy.jpg";
import negz from "./assets/negz.jpg";
import posx from "./assets/posx.jpg";
import posy from "./assets/posy.jpg";
import posz from "./assets/posz.jpg";

import skyboxVertexShaderSource from "./shaders/skybox/skybox.vs";
import skyboxFragmentShaderSource from "./shaders/skybox/skybox.fs";

import vertexShaderSource from "./shaders/cube/cube.vs";
import fragmentShaderSource from "./shaders/cube/cube.fs";

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
  document.addEventListener('wheel', function(e) {
    camera.process_mouse_scroll(e.deltaY > 0 ? 1 : -1);
  });
  // catch key event to move camera
  document.addEventListener('keydown', function(e) {
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
  document.addEventListener('mousedown', function(e) {
    mouse_down = true;
    last_x = e.clientX;
    last_y = e.clientY;
  });
  document.addEventListener('mousemove', function(e) {
    if (!mouse_down) return;
    camera.process_mouse_movement(e.clientX - last_x,  e.clientY - last_y);
    last_x = e.clientX;
    last_y = e.clientY;
  });
  document.addEventListener('mouseup', function(e) {
    mouse_down = false;
  });

  twgl.setDefaults({attribPrefix: "a_"});



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

      
  

  // create a programinfo from shaders
  const cubeProgramInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);
  const skyboxProgramInfo = twgl.createProgramInfo(gl, [skyboxVertexShaderSource, skyboxFragmentShaderSource]);


  const cubeBuffer = twgl.primitives.createCubeBufferInfo(gl, 1);
  const cubeVAO = twgl.createVAOFromBufferInfo(gl, cubeProgramInfo, cubeBuffer);
  const quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
  const quadVAO = twgl.createVAOFromBufferInfo(gl, skyboxProgramInfo, quadBufferInfo);

  // Draw the scene.
  function render() {

    twgl.resizeCanvasToDisplaySize(canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // turn on culling & depth test
    gl.enable(gl.DEPTH_TEST);
    
    // SkyBox
    const skyboxCameraMatrix = mat4.invert(mat4.create(), camera.get_view_matrix());
    gl.depthFunc(gl.LEQUAL);
    gl.useProgram(skyboxProgramInfo.program);
    gl.bindVertexArray(quadVAO);


    var viewDirectionMatrix = mat4.copy(mat4.create(), skyboxCameraMatrix);
    viewDirectionMatrix[12] = 0;
    viewDirectionMatrix[13] = 0;
    viewDirectionMatrix[14] = 0;

    var viewDirectionProjection = mat4.multiply(mat4.create(), camera.get_projection_matrix(canvas.width, canvas.height), viewDirectionMatrix);

    console.log(viewDirectionProjection)

    var viewDirectionProjectionInv = mat4.invert(mat4.create(), viewDirectionProjection);
    // console.log(viewDirectionProjectionInv)

    twgl.setUniforms(skyboxProgramInfo, {
      u_viewDirectionProjectionInverse: viewDirectionProjectionInv,
      u_skybox: skyboxTexture,
    });
    twgl.drawBufferInfo(gl, quadBufferInfo); 
    
    
    // Cube
    // set View Matrix from Camera
    // Make a view matrix from the camera matrix.
    // turn on depth testing & tell webgl to cull faces
    gl.enable(gl.DEPTH_TEST);
    const viewMatrix = mat4.multiply(mat4.create(), camera.get_projection_matrix(canvas.width, canvas.height), camera.get_view_matrix());
    gl.depthFunc(gl.LESS);
    gl.useProgram(cubeProgramInfo.program);
    gl.bindVertexArray(cubeVAO);

    const uniforms = {
      u_colorMult: [0.5, 1, 0.5, 1],
      u_matrix: viewMatrix,
      u_color: [0.5, 0.5, 1, 1],
    };

    // twgl.setBuffersAndAttributes(gl, cubeProgramInfo, cubeBuffer);

    twgl.setUniforms(cubeProgramInfo, uniforms);

    twgl.drawBufferInfo(gl, cubeBuffer);


    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}



main();


