import { mat4, vec3 } from 'gl-matrix';
import * as twgl from 'twgl.js';
import { Camera } from './common/camera';
import { FrameBufferExporter } from './common/frame_buffer';

import chromeImage from './assets/chrome.png';
import { Accumlator, AccumlatorExporter } from './common/accumlator';

function addRandomColor(verticesArray: {[key: string]: twgl.primitives.TypedArray}): void {
    const numElements = verticesArray.position.length / 3;
    const colors = twgl.primitives.createAugmentedTypedArray(4, numElements);
    for (let i = 0; i < numElements; ++i) {
        colors.push(1, 1, 1, 1);
    }
    verticesArray.color = colors;
}

function createImmutableImageTexture(gl: WebGL2RenderingContext, image: HTMLImageElement) : WebGLTexture {
    const texture = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    twgl.setTextureParameters(gl, texture, {
        mag: gl.LINEAR,
        min: gl.LINEAR_MIPMAP_LINEAR,
        wrap: gl.REPEAT,
    });

    const levels = Math.floor(Math.log2(Math.max(image.width, image.height))) + 1;

    gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, image.width, image.height);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, image.width, image.height, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);

    return texture;
}



function createImmutableTexture(gl: WebGL2RenderingContext, type: number) : WebGLTexture {
    const texture = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    twgl.setTextureParameters(gl, texture, {
        minMag: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE,
    });

    gl.texStorage2D(gl.TEXTURE_2D, 1, type, gl.drawingBufferWidth, gl.drawingBufferHeight);

    return texture;
}

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

    if (!gl.getExtension("EXT_color_buffer_float")) {
        alert("FLOAT color buffer not available");
        return;
    }

    twgl.setDefaults({ attribPrefix: "a_" });


    const camera = new Camera(vec3.fromValues(0.0, 0.0, 10.0));
    const lightPosition = vec3.fromValues(1, 1, 2);

    // create a frame buffer

    const texture_accumcolor = createImmutableTexture(gl, gl.RGBA16F);
    const texture_accumalpha = createImmutableTexture(gl, gl.R16F);
    const texture_depth = createImmutableTexture(gl, gl.DEPTH_COMPONENT16);

    const attachments: twgl.AttachmentOptions[] = [
        {
            attachment: texture_accumcolor, attachmentPoint: gl.COLOR_ATTACHMENT0,
        },
        {
            attachment: texture_accumalpha, attachmentPoint: gl.COLOR_ATTACHMENT1,
        },
        {
            attachment: texture_depth, attachmentPoint: gl.DEPTH_ATTACHMENT,
        }
    ];

    

    const frame_buffer = twgl.createFramebufferInfo(gl, attachments);
    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status != gl.FRAMEBUFFER_COMPLETE) {
        alert("frame buffer is not complete!");
    }
    twgl.bindFramebufferInfo(gl, null);


    
    
    // accumlator and exporter
    const accumlator = new Accumlator(gl, frame_buffer);
    const exporter = new AccumlatorExporter(gl);

    // create a cube
    const cubeVertices = twgl.primitives.createCubeVertices(2);
    addRandomColor(cubeVertices);
    // create a cube buffer
    const cubeBuffer = twgl.createBufferInfoFromArrays(gl, cubeVertices);
    // create a cube VAO
    const cubeVAO = twgl.createVAOFromBufferInfo(gl, accumlator.programInfo, cubeBuffer);
    console.log(cubeVertices);

    // color, depth and stencil
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.BLEND)
    gl.depthMask(false);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);


    const image = new Image();
    image.src = chromeImage;
    image.onload = () => {
        console.log(image.width, image.height)
        const image_texture = createImmutableImageTexture(gl, image);

        function render(time: number) {
            time *= 0.001;
    
            // resize canvas to displaying size
            twgl.resizeCanvasToDisplaySize(canvas);
    
            accumlator.render(canvas, camera, lightPosition, (programInfo: twgl.ProgramInfo) => {
                const modelMatrix = mat4.create();
                mat4.rotateX(modelMatrix, modelMatrix, time);
                mat4.rotateY(modelMatrix, modelMatrix, time);
    
                const uniforms = {
                    u_model_matrix: modelMatrix,
                    u_texture: image_texture,
                };
    
                twgl.setUniforms(programInfo, uniforms);
                gl.bindVertexArray(cubeVAO);
                twgl.drawBufferInfo(gl, cubeBuffer);
            });    
    
    
            // render buffer texture to screen
    
            // bind default frame buffer
            twgl.bindFramebufferInfo(gl, null);
            // render frame buffer to screen
            exporter.render(canvas, frame_buffer);
    
    
            requestAnimationFrame(render);
        }
    
        requestAnimationFrame(render);
    }


}

main()

console.log('ready.')