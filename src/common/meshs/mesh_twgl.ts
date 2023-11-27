import * as twgl from 'twgl.js'


import { createWebGLTextureFromThreeMesh, createTWGLVerticesFromThreeMesh,  } from './mesh_three';
import { mat4, vec3 } from 'gl-matrix';
import { getDefaultSkyBox } from '../utils/twgl_utils';

interface TWGLMesh {
    verticesArray: { [key: string]: twgl.primitives.TypedArray };
    bufferInfo: twgl.BufferInfo;
    diffuseTexture: WebGLTexture;
    specularTexture: WebGLTexture;
    bumpTexture: WebGLTexture;
}

function addRandomColor(verticesArray: { [key: string]: twgl.primitives.TypedArray }, alpha: number = 1): void {
    const numElements = verticesArray.position.length / 3;
    const colors = twgl.primitives.createAugmentedTypedArray(4, numElements);
    for (let i = 0; i < numElements; ++i) {
        colors.push(1, 1, 1, alpha);
    }
    verticesArray.color = colors;
}


function createBufferVaoColored(vertices: { [key: string]: twgl.primitives.TypedArray }, gl: WebGL2RenderingContext, programInfo: twgl.ProgramInfo, alpha: number = 1): { buffer: twgl.BufferInfo, vao: WebGLVertexArrayObject } {
    // create a cube
    addRandomColor(vertices, alpha);
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

function createTWGLBufferColored(vertices: { [key: string]: twgl.primitives.TypedArray }, gl: WebGL2RenderingContext, alpha: number = 1): twgl.BufferInfo {
    // create a cube
    addRandomColor(vertices, alpha);
    // create a cube buffer
    const buffer = twgl.createBufferInfoFromArrays(gl, vertices);
    console.log(vertices);
    return buffer;
}

async function createTWGLMeshesFromThreeMeshes(meshes: THREE.Mesh[], gl: WebGL2RenderingContext) {
    const twglMeshes: TWGLMesh[] = [];
    const length = meshes.length;
    for (let i = 0; i < length; i++) {
        const ca = meshes[i];
        const vertices = createTWGLVerticesFromThreeMesh(ca);
        const buffer = createTWGLBufferColored(vertices, gl);

        const { diffuse_texture, specular_texture, bump_texture } = await createWebGLTextureFromThreeMesh(ca, gl);
        twglMeshes.push({
            verticesArray: vertices,
            bufferInfo: buffer,
            diffuseTexture: diffuse_texture,
            specularTexture: specular_texture,
            bumpTexture: bump_texture,
        });
    }
    return twglMeshes;
}

function createDrawObjectFromTWGLMesh(mesh: TWGLMesh, programInfo: twgl.ProgramInfo, position: vec3, gl: WebGL2RenderingContext) {
    return {
        programInfo: programInfo,
        bufferInfo: mesh.bufferInfo,
        uniforms: {
            u_texture: mesh.diffuseTexture,
            u_specular_texture: mesh.specularTexture,
            u_bump_texture: mesh.bumpTexture,
            u_model_matrix: mat4.fromTranslation(mat4.create(), position),
            u_is_skybox: false,
            u_skybox: getDefaultSkyBox(gl),
        }
    }
}

function createDrawObjectsFromTWGLMeshes(meshes: TWGLMesh[], programInfo: twgl.ProgramInfo, position: vec3, gl: WebGL2RenderingContext) {
    const drawObjects = [];
    for (let i = 0; i < meshes.length; i++) {
        drawObjects.push(createDrawObjectFromTWGLMesh(meshes[i], programInfo, position, gl));
    }
    return drawObjects;
}

export {
    TWGLMesh,
    createTWGLMeshesFromThreeMeshes,
    createDrawObjectsFromTWGLMeshes,
    addRandomColor
}