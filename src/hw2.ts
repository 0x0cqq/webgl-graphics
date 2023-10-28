import { mat4, vec3, vec4 } from 'gl-matrix';
import * as twgl from 'twgl.js';
import { Camera } from './camera';


const vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec4 a_color;

// A matrix to transform the positions by
uniform mat4 u_matrix;

// a varying the color to the fragment shader
out vec4 v_color;

// all shaders have a main function
void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

  // Pass the color to the fragment shader.
  v_color = a_color;
}
`;

const fragmentShaderSource = `#version 300 es

precision highp float;

// the varied color passed from the vertex shader
in vec4 v_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = v_color;
}
`;


// this function takes a set of indexed vertices
// It deindexed them. It then adds random vertex
// colors to each triangle. Finally it passes
// the result to createBufferInfoFromArrays and
// returns a twgl.BufferInfo
function createFlattenedVertices(gl: any, vertices: any, vertsPerColor: any) {
  let last: number;
  return twgl.createBufferInfoFromArrays(
      gl,
      twgl.primitives.makeRandomVertexColors(
          twgl.primitives.deindexVertices(vertices),
          {
            vertsPerColor: vertsPerColor || 1,
            rand: function(ndx, channel) {
              if (channel === 0) {
                last = 128 + Math.random() * 128 | 0;
              }
              return channel < 3 ? last : 255;
            },
          })
    );
}

function createFlattenedFunc(createVerticesFunc: any, vertsPerColor: any) {
  return function(gl: any, ...args: any[]) {
    const arrays = createVerticesFunc.apply(null,  Array.prototype.slice.call(arguments, 1));
    return createFlattenedVertices(gl, arrays, vertsPerColor);
  };
}

// These functions make primitives with semi-random vertex colors.
// This means the primitives can be displayed without needing lighting
// which is important to keep the samples simple.


const flattenedPrimitives = {
  "createCubeBufferInfo": createFlattenedFunc(twgl.primitives.createCubeVertices, 6),
  "createSphereBufferInfo": createFlattenedFunc(twgl.primitives.createSphereVertices, 6),
  "createTruncatedConeBufferInfo": createFlattenedFunc(twgl.primitives.createTruncatedConeVertices, 6),
};


function main() {
  // Get A WebGL context
  const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;

  if (!gl) {
    alert("No WebGL2! Please use a newer browser.");
    return;
  }

  twgl.setDefaults({attribPrefix: "a_"});

  // create a camera
  const camera = new Camera(vec3.fromValues(0.0, 0.0, 4.0));

  // create a programinfo from shaders
  const programInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);


  const cubeBuffer = flattenedPrimitives.createCubeBufferInfo(gl, 1);
  const cubeVAO = twgl.createVAOFromBufferInfo(gl, programInfo, cubeBuffer);

  // Draw the scene.
  function render() {

    twgl.resizeCanvasToDisplaySize(canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // turn on depth testing & tell webgl to cull faces
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(programInfo.program);

    // set View Matrix from Camera
    // Make a view matrix from the camera matrix.
    const viewMatrix = mat4.multiply(mat4.create(), camera.get_projection_matrix(canvas.width, canvas.height), camera.get_view_matrix());

    const uniforms = {
      u_matrix: viewMatrix,
    };

    gl.bindVertexArray(cubeVAO);

    twgl.setBuffersAndAttributes(gl, programInfo, cubeBuffer);

    twgl.setUniforms(programInfo, uniforms);

    twgl.drawBufferInfo(gl, cubeBuffer);


    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

// Fill the current ARRAY_BUFFER buffer
// with a cube 
function getDataArray() {
  var positions = new Float32Array([
    // front
    100, 100, 100,
    200, 100, 100,
    


  ]);

  return positions;
}

function getColorArray(): Uint8Array {
  return new Uint8Array([

  ])
}


main();
