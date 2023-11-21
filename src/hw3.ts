import { mat4, vec3 } from 'gl-matrix';
import * as twgl from 'twgl.js';
import { Camera } from './common/camera';

// import three obj loader and mtl loader
import { createMeshesFromFileName, createDrawObjectsFromMeshes, createBufferColored, createImmutableImageTexture } from './common/objects/objfile';

import chromeImage from './assets/chrome.png';
import { Accumlator, AccumlatorExporter } from './common/accumlator';
import { getWhiteTexture, myDrawObjectList } from './utils/twgl_utils';


async function main() {
    // Get A WebGL context
    const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    // resize canvas to displaying size
    twgl.resizeCanvasToDisplaySize(canvas);

    if (!gl) {
        alert("No WebGL2! Please use a newer browser.");
        return;
    }

    if (!gl.getExtension("EXT_color_buffer_float")) {
        alert("FLOAT color buffer not available");
        return;
    }

    twgl.setDefaults({ attribPrefix: "a_" });


    const camera = new Camera(vec3.fromValues(0.0, 8.0, 30.0));
    camera.setup_interaction(canvas);
    const lightPosition = vec3.fromValues(0, 0, 10);

    // accumlator and exporter
    const accumlator = new Accumlator(gl);
    const accum_exporter = new AccumlatorExporter(gl, accumlator);

    // color, depth and stencil
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);


    const image = new Image();
    image.src = chromeImage;

    await new Promise<void>((resolve) => {
        image.onload = () => {
            resolve();
        }
    });

    console.log(image.width, image.height)
    const image_texture_cube = createImmutableImageTexture(gl, image);

    const cubeVertices = twgl.primitives.createCubeVertices(4);
    const cubeBuffer = createBufferColored(cubeVertices, gl, 1);

    // load with three.js
    const meshes = await createMeshesFromFileName('./models/nanosuit/nanosuit', gl);
    const meshDrawObjects = createDrawObjectsFromMeshes(meshes, accumlator.normalprogramInfo);


    function render(time: number) {
        time *= 0.001;

        // resize canvas to displaying size
        twgl.resizeCanvasToDisplaySize(canvas);

        accumlator.render(canvas, camera, lightPosition,
            // normal render
            (programInfo: twgl.ProgramInfo) => {
                const modelMatrix = mat4.create();
                // mat4.rotateX(modelMatrix, modelMatrix, time);
                mat4.rotateY(modelMatrix, modelMatrix, time);

                const uniforms = {
                    u_model_matrix: modelMatrix,
                };

                twgl.setUniforms(programInfo, uniforms);

                myDrawObjectList(gl, meshDrawObjects);

            },
            // oit render
            (programInfo: twgl.ProgramInfo) => {
                const modelMatrix = mat4.create();
                // move the cube
                mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(0.0, 0.0, 0.0));
                // rotate the cube
                mat4.rotateX(modelMatrix, modelMatrix, time);
                mat4.rotateY(modelMatrix, modelMatrix, time);

                const uniforms = {
                    u_model_matrix: modelMatrix,
                    u_texture: image_texture_cube,
                    u_specular_texture: getWhiteTexture(gl),
                    u_bump_texture: getWhiteTexture(gl),
                };

                twgl.setUniforms(programInfo, uniforms);

                twgl.createVAOFromBufferInfo(gl, programInfo, cubeBuffer);
                twgl.setBuffersAndAttributes(gl, programInfo, cubeBuffer);
                twgl.drawBufferInfo(gl, cubeBuffer);

            });

        // render frame buffer to screen
        accum_exporter.render(canvas);


        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    console.log("ready.")
}

main()
