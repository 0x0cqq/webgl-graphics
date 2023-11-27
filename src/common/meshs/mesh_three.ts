import * as twgl from "twgl.js";
import { getWhiteImageData, getWhiteTexture } from "../utils/twgl_utils";
import { createImmutableImageTexture } from "./image_utils";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

const max_times = 30;


// ---- textures ----
async function getWebGLTextureFromThreeTexture(three_texture: THREE.Texture | null, gl: WebGL2RenderingContext) {
    let times = 0;
    while ((three_texture == null || three_texture.image == null || three_texture.image.src == null) && times < max_times) {
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
            };
        });
        return createImmutableImageTexture(gl, image);
    }
}

async function getImageDataFromThreeTexture(three_texture: THREE.Texture | null) {
    let times = 0;
    while ((three_texture == null || three_texture.image == null || three_texture.image.src == null) && times < max_times) {
        await new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 20);
        });
        times += 1;
    }

    if (three_texture == null || three_texture.image == null || three_texture.image.src == null) {
        return getWhiteImageData();
    } else {
        const src = three_texture!.image.src;
        const image = new Image();
        image.src = src;
        await new Promise<void>((resolve) => {
            image.onload = () => {
                resolve();
            };
        });
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height);
    }
}


async function createWebGLTextureFromThreeMesh(ca: THREE.Mesh, gl: WebGL2RenderingContext) {
    // get texture from obj & mtl file for cyborg, using three.js
    const material = ca.material as THREE.MeshPhongMaterial;
    console.log(material);

    const diffuse_texture = await getWebGLTextureFromThreeTexture(material.map, gl);
    const specular_texture = await getWebGLTextureFromThreeTexture(material.specularMap, gl);
    const bump_texture = await getWebGLTextureFromThreeTexture(material.bumpMap, gl);

    return { diffuse_texture, specular_texture, bump_texture };
}

async function createImageDataFromThreeMesh(ca: THREE.Mesh) {
    // get texture from obj & mtl file for cyborg, using three.js
    const material = ca.material as THREE.MeshPhongMaterial;
    console.log(material);

    const diffuse_texture = await getImageDataFromThreeTexture(material.map);
    const specular_texture = await getImageDataFromThreeTexture(material.specularMap);
    const bump_texture = await getImageDataFromThreeTexture(material.bumpMap);

    return { diffuse_texture, specular_texture, bump_texture };
}


// ---- vertices ----
function createTWGLVerticesFromThreeMesh(ca: THREE.Mesh) {
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
    return vertices;
}


// ----- final
async function createThreeMeshesFromFileName(name: string, gl: WebGL2RenderingContext) {
    const loader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    const materials = await mtlLoader.loadAsync(name + '.mtl');
    materials.preload();
    loader.setMaterials(materials);
    const model = await loader.loadAsync(name + '.obj');
    console.log(model);
    const length = model.children.length;
    const meshes: THREE.Mesh[] = [];
    for (let i = 0; i < length; i++) {
        const ca = model.children[i] as THREE.Mesh;
        meshes.push(ca as THREE.Mesh);
    }
    return meshes;
}

export {
    createWebGLTextureFromThreeMesh,
    createImageDataFromThreeMesh,
    createTWGLVerticesFromThreeMesh,
    createThreeMeshesFromFileName
}
