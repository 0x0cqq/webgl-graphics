import * as twgl from 'twgl.js'

import { getWhiteTexture } from '../../utils/twgl_utils';

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

interface Mesh {
    verticesArray: { [key: string]: twgl.primitives.TypedArray };
    bufferInfo: twgl.BufferInfo;
    diffuseTexture: WebGLTexture;
    specularTexture: WebGLTexture;
    bumpTexture: WebGLTexture;
}

function createVerticesFromMesh(ca: THREE.Mesh, gl: WebGL2RenderingContext) {
    const vertices = {
        position: twgl.primitives.createAugmentedTypedArray(3, ca.geometry.attributes.position.array.length / 3),
        normal: twgl.primitives.createAugmentedTypedArray(3, ca.geometry.attributes.normal.array.length / 3),
        texcoord: twgl.primitives.createAugmentedTypedArray(2, ca.geometry.attributes.uv.array.length / 2),
    };

    for (let i = 0; i < ca.geometry.attributes.position.array.length; i += 3) {
        vertices.position.push(ca.geometry.attributes.position.array[i], ca.geometry.attributes.position.array[i + 1], ca.geometry.attributes.position.array[i + 2]);
    }
    for (let i = 0; i < ca.geometry.attributes.normal.array.length; i += 3) {
        vertices.normal.push(ca.geometry.attributes.normal.array[i], ca.geometry.attributes.normal.array[i + 1], ca.geometry.attributes.normal.array[i + 2]);
    }
    for (let i = 0; i < ca.geometry.attributes.uv.array.length; i += 2) {
        vertices.texcoord.push(ca.geometry.attributes.uv.array[i], ca.geometry.attributes.uv.array[i + 1]);
    }

    console.log(vertices);

    return vertices;
}

function addRandomColor(verticesArray: { [key: string]: twgl.primitives.TypedArray }, alpha: number = 1): void {
    const numElements = verticesArray.position.length / 3;
    const colors = twgl.primitives.createAugmentedTypedArray(4, numElements);
    for (let i = 0; i < numElements; ++i) {
        colors.push(1, 1, 1, alpha);
    }
    verticesArray.color = colors;
}


export function createBufferVaoColored(vertices: { [key: string]: twgl.primitives.TypedArray }, gl: WebGL2RenderingContext, programInfo: twgl.ProgramInfo, alpha: number = 1): { buffer: twgl.BufferInfo, vao: WebGLVertexArrayObject } {
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

export function createBufferColored(vertices: { [key: string]: twgl.primitives.TypedArray }, gl: WebGL2RenderingContext, alpha: number = 1): twgl.BufferInfo {
    // create a cube
    addRandomColor(vertices, alpha);
    // create a cube buffer
    const buffer = twgl.createBufferInfoFromArrays(gl, vertices);
    console.log(vertices);
    return buffer;
}

async function createTextureFromMesh(ca: THREE.Mesh, gl: WebGL2RenderingContext) {
    // get texture from obj & mtl file for cyborg, using three.js
    const material = ca.material as THREE.MeshPhongMaterial;
    console.log(material);

    const diffuse_texture = await getWebGLTextureFromThreeTexture(material.map, gl);
    const specular_texture = await getWebGLTextureFromThreeTexture(material.specularMap, gl);
    const bump_texture = await getWebGLTextureFromThreeTexture(material.bumpMap, gl);

    return {diffuse_texture, specular_texture, bump_texture};
}

export function createImmutableImageTexture(gl: WebGL2RenderingContext, image: HTMLImageElement): WebGLTexture {
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



async function getWebGLTextureFromThreeTexture(three_texture: THREE.Texture | null, gl: WebGL2RenderingContext) {
    let times = 0;
    while ((three_texture == null || three_texture.image == null || three_texture.image.src == null) && times < 10) {
        await new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 20);
        });
        times += 1;
    }

    
    if (three_texture == null || three_texture.image == null || three_texture.image.src == null) {
        return getWhiteTexture(gl);
    } else {
        const image = new Image();
        image.src = three_texture!.image.src;
        await new Promise<void>((resolve) => {
            image.onload = () => {
                resolve();
            }
        });
        return createImmutableImageTexture(gl, image);
    }
}


export async function createMeshesFromFileName(name: string, gl: WebGL2RenderingContext): Promise<Mesh[]> {
    const loader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    const materials = await mtlLoader.loadAsync(name + '.mtl');
    materials.preload();
    loader.setMaterials(materials);
    const model = await loader.loadAsync(name + '.obj');
    console.log(model);
    const length = model.children.length;
    
    const meshes: Mesh[] = [];
    for (let i = 0; i < length; i++) {
        const ca = model.children[i] as THREE.Mesh;
        const vertices = createVerticesFromMesh(ca, gl);
        const buffer = createBufferColored(vertices, gl);

        const { diffuse_texture, specular_texture, bump_texture } = await createTextureFromMesh(ca, gl);
        meshes.push({
            verticesArray: vertices,
            bufferInfo: buffer,
            diffuseTexture: diffuse_texture,
            specularTexture: specular_texture,
            bumpTexture: bump_texture,
        });
    }
    return meshes;
}

function createDrawObjectFromMesh(mesh: Mesh, programInfo: twgl.ProgramInfo) {
    return {
        programInfo: programInfo,
        bufferInfo: mesh.bufferInfo,
        uniforms: {
            u_texture: mesh.diffuseTexture,
            u_specular_texture: mesh.specularTexture,
            u_bump_texture: mesh.bumpTexture,
        }
    }
}

export function createDrawObjectsFromMeshes(meshes: Mesh[], programInfo: twgl.ProgramInfo) {
    const drawObjects = [];
    for (let i = 0; i < meshes.length; i++) {
        drawObjects.push(createDrawObjectFromMesh(meshes[i], programInfo));
    }
    return drawObjects;
}