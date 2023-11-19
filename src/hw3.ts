import { mat4, vec3 } from 'gl-matrix';
import * as twgl from 'twgl.js';
import { Camera } from './common/camera';

// import three obj loader and mtl loader

import { load_obj_to_twgl } from './common/obj_loader';

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

import chromeImage from './assets/chrome.png';
import { Accumlator, AccumlatorExporter } from './common/accumlator';


function addRandomColor(verticesArray: { [key: string]: twgl.primitives.TypedArray }): void {
    const numElements = verticesArray.position.length / 3;
    const colors = twgl.primitives.createAugmentedTypedArray(4, numElements);
    for (let i = 0; i < numElements; ++i) {
        colors.push(1, 1, 1, 1);
    }
    verticesArray.color = colors;
}

function createVerticesFromMesh(ca: THREE.Mesh, gl: WebGL2RenderingContext) {
    const vertices = {
        position: twgl.primitives.createAugmentedTypedArray(3, ca.geometry.attributes.position.array.length / 3),
        normal: twgl.primitives.createAugmentedTypedArray(3, ca.geometry.attributes.normal.array.length / 3),
        texcoord: twgl.primitives.createAugmentedTypedArray(2, ca.geometry.attributes.uv.array.length / 2),
    };

    for(let i = 0; i < ca.geometry.attributes.position.array.length; i += 3) {
        vertices.position.push(ca.geometry.attributes.position.array[i], ca.geometry.attributes.position.array[i+1], ca.geometry.attributes.position.array[i+2]);
    }
    for(let i = 0; i < ca.geometry.attributes.normal.array.length; i += 3) {
        vertices.normal.push(ca.geometry.attributes.normal.array[i], ca.geometry.attributes.normal.array[i+1], ca.geometry.attributes.normal.array[i+2]);
    }
    for(let i = 0; i < ca.geometry.attributes.uv.array.length; i += 2) {
        vertices.texcoord.push(ca.geometry.attributes.uv.array[i], ca.geometry.attributes.uv.array[i+1]);
    }

    console.log(vertices);
    
    return vertices;
}

async function createTextureFromMesh(ca: THREE.Mesh, gl: WebGL2RenderingContext) {
    // get texture from obj & mtl file for cyborg, using three.js
    const material = ca.material as THREE.MeshPhongMaterial;
    console.log(material);
    // transform to webgl texture
    const image = new Image();
    
    // wait until material.map == null || material.map!.image == null || material.map!.image.src == null
    while(material.map == null || material.map!.image == null || material.map!.image.src == null) {
        await new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 100);
        });
    }

    image.src = material.map!.image.src;

    await new Promise<void>((resolve) => {
        image.onload = () => {
            resolve();
        }
    });
    console.log(image);
    const imageTexture = createImmutableImageTexture(gl, image);
    return imageTexture;
}

function createImmutableImageTexture(gl: WebGL2RenderingContext, image: HTMLImageElement): WebGLTexture {
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

function create_buffer_vao_colored(vertices: { [key: string]: twgl.primitives.TypedArray }, gl: WebGL2RenderingContext, programInfo: twgl.ProgramInfo): { buffer: twgl.BufferInfo, vao: WebGLVertexArrayObject } {
    // create a cube
    addRandomColor(vertices);
    // create a cube buffer
    const buffer = twgl.createBufferInfoFromArrays(gl, vertices);
    // create a cube VAO
    const vao = twgl.createVAOFromBufferInfo(gl, programInfo, buffer);
    console.log(vertices);
    return {
        buffer: buffer,
        vao: vao!,
    }
}


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


    const camera = new Camera(vec3.fromValues(0.0, 0.0, 10.0));
    camera.setup_interaction(canvas);
    const lightPosition = vec3.fromValues(1, 1, 2);

    // accumlator and exporter
    const accumlator = new Accumlator(gl);
    const accum_exporter = new AccumlatorExporter(gl, accumlator);

    // color, depth and stencil
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.BLEND)
    gl.depthMask(false);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);


    const image = new Image();
    image.src = chromeImage;

    await new Promise<void>((resolve) => {
        image.onload = () => {
            resolve();
        }
    });

    console.log(image.width, image.height)
    const image_texture = createImmutableImageTexture(gl, image);

    const cubeVertices = twgl.primitives.createCubeVertices(2);
    const { buffer: cubeBuffer, vao: cubeVAO } = create_buffer_vao_colored(cubeVertices, gl, accumlator.programInfo);


    // const cyborgVertices = await load_obj_to_twgl('./models/nanosuit/nanosuit.obj', './models/nanosuit/nanosuit.mtl');

    // load with three.js
    const loader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    const materials = await mtlLoader.loadAsync('./models/nanosuit/nanosuit.mtl');
    materials.preload();
    loader.setMaterials(materials);
    const cyborg = await loader.loadAsync('./models/nanosuit/nanosuit.obj');
    console.log(cyborg);

    // build vertices array
    const buffers: twgl.BufferInfo[] = [];
    const vaos: WebGLVertexArrayObject[] = [];
    const imageTextures: WebGLTexture[] = [];

    const length = cyborg.children.length;
    for(let i = 0; i < length; i++) {
        const ca = cyborg.children[i] as THREE.Mesh;
        const vertices = createVerticesFromMesh(ca, gl);
        const { buffer, vao } = create_buffer_vao_colored(vertices, gl, accumlator.programInfo);
        buffers.push(buffer);
        vaos.push(vao);

        const imageTexture = await createTextureFromMesh(ca, gl);
        imageTextures.push(imageTexture);
    }

    function render(time: number) {
        time *= 0.001;

        // resize canvas to displaying size
        twgl.resizeCanvasToDisplaySize(canvas);

        accumlator.render(canvas, camera, lightPosition, (programInfo: twgl.ProgramInfo) => {
            const modelMatrix = mat4.create();
            // mat4.rotateX(modelMatrix, modelMatrix, time);
            // mat4.rotateY(modelMatrix, modelMatrix, time);

            const uniforms = {
                u_model_matrix: modelMatrix,
            };

            twgl.setUniforms(programInfo, uniforms);

            // gl.bindVertexArray(cubeVAO);
            // twgl.drawBufferInfo(gl, cubeBuffer);
            
            for(let i = 0; i < length; i++) {
                const this_uniform = {
                    u_texture: imageTextures[i], 
                };
                twgl.setUniforms(programInfo, this_uniform);
                gl.bindVertexArray(vaos[i]);
                twgl.drawBufferInfo(gl, buffers[i]);
            }
        });


        // render buffer texture to screen
        // bind default frame buffer
        twgl.bindFramebufferInfo(gl, null);
        // render frame buffer to screen
        accum_exporter.render(canvas);


        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);


}

main()

console.log('ready.')