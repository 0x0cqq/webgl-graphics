// 要求能配置模型的位置、纹理和材质、点光源的位置。

import { mat4, vec2, vec3 } from "gl-matrix";
import { CameraData } from "./config";
import { Camera } from "../camera";
import { Mesh, Scene } from "../raytracer";
import { createThreeMeshesFromFileName } from '../meshs/mesh_three';
import { TWGLMesh, addRandomColor, createDrawObjectsFromTWGLMeshes, createTWGLMeshesFromThreeMeshes } from "../meshs/mesh_twgl";
import * as THREE from "three";
import * as twgl from "twgl.js";
import { getDefaultSkyBox, getWhiteImageData, getWhiteTexture } from "../utils/twgl_utils";
import { createImmutableImageTexture } from "../meshs/image_utils";


enum ObjectShapeType {
    DEFAULT, // for custom mesh from .obj file
    SPHERE,
    CUBE
}

enum MaterialType {
    DIFFUSE,   // normal
    SPECULAR,  // mirror
    REFRACTIVE // glass
}

enum TextureType {
    CONSTANT, // a constant color
    IMAGE,    // read from image
    FILE      // read from obj/mtl file
}

interface TextureData {
    type: TextureType;
    // if type == CONSTANT, provide a vec4 color
    color?: number[]; // vec4, 
    // if it's IMAGE, provide full file path
    // else (FILE for .mtl and .obj) provide the file name without extension
    file?: string; 
}

interface RayTraceObjectData {
    position: number[]; // vec3
    size?: number;
    shape: ObjectShapeType;
    material: MaterialType; // will be ignored if file texture is provided
    texture: TextureData;
}

interface SceneData {
    camera: CameraData; // camera
    light_position: number[]; // vec3
    objects: RayTraceObjectData[];
}

class RayTraceConfigReader {
    gl: WebGL2RenderingContext;
    constructor (gl: WebGL2RenderingContext) {
        this.gl = gl;
    }
    readFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => {
                try {
                    let data = reader.result as string;
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            };
        });
    }
    load(file: File): Promise<SceneData> {
        return new Promise((resolve, reject) => {
            this.readFile(file).then((data) => {
                try {
                    const config_data = JSON.parse(data) as SceneData;
                    resolve(config_data);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
    private set_camera(cameraData: CameraData, camera: Camera) {
        if(cameraData.position.length != 3) {
            alert("Camera position should be a 3D vector");
            return;
        }
        if(cameraData.angle.length != 2) {
            alert("Camera angle should be a 2D vector (yaw, pitch)");
            return;
        }
        if(cameraData.angle[1] <= -89 || cameraData.angle[1] >= 89) {
            alert(`camera pitch should be in range (-89, 89), but got ${cameraData.angle[1]}`);
            return;
        }
        if(cameraData.zoom <= 0 || cameraData.zoom > 90) {
            alert(`camera zoom should be in range (0, 90], but got ${cameraData.zoom}`);
            return;
        }
        camera.set_position(vec3.fromValues(cameraData.position[0], cameraData.position[1], cameraData.position[2]));
        camera.set_yaw_pitch(cameraData.angle[0], cameraData.angle[1]);
        camera.set_zoom(cameraData.zoom);
    }

    private getVerticesFromType(shape: ObjectShapeType, size: number): { [key: string]: twgl.primitives.TypedArray } {
        if (shape == ObjectShapeType.SPHERE) {
            return twgl.primitives.createSphereVertices(size, 32, 32);
        } else if (shape == ObjectShapeType.CUBE) {
            return twgl.primitives.createCubeVertices(size);
        } else {
            console.error("Unknown shape type");
            return {};
        }
    }

    private async createWebGLTextureFromTextureData(textureData: TextureData) {
        if (textureData.type == TextureType.CONSTANT) {
            return getWhiteTexture(this.gl, textureData.color);
        } else if (textureData.type == TextureType.IMAGE) {
            const image = new Image();
            image.src = textureData.file!;
            await new Promise<void>((resolve, reject) => {
                image.onload = () => { resolve(); }
                image.onerror = () => { reject(); }
            });
            return createImmutableImageTexture(this.gl, image);
        } else {
            console.error("Unknown texture type");
            return getWhiteTexture(this.gl);
        }
    }

    private async createImageDataFromTextureData(textureData: TextureData) {
        if (textureData.type == TextureType.CONSTANT) {
            return getWhiteImageData(textureData.color);
        } else if (textureData.type == TextureType.IMAGE) {
            const image = new Image();
            image.src = textureData.file!;
            await new Promise<void>((resolve, reject) => {
                image.onload = () => { resolve(); }
                image.onerror = () => { reject(); }
            });
            const canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext("2d")!;
            context.drawImage(image, 0, 0);
            return context.getImageData(0, 0, image.width, image.height);
        } else {
            console.error("Unknown texture type");
            return getWhiteImageData();
        }
    }

    private createVec3ArrayFromTypedArray(typedArray: twgl.primitives.TypedArray): vec3[] {
        const length = typedArray.length;
        const vec3Array: vec3[] = [];
        for (let i = 0; i < length; i += 3) {
            vec3Array.push(vec3.fromValues(typedArray[i], typedArray[i + 1], typedArray[i + 2]));
        }
        return vec3Array;
    }

    private createVec2ArrayFromTypedArray(typedArray: twgl.primitives.TypedArray): vec2[] {
        const length = typedArray.length;
        const vec2Array: vec2[] = [];
        for (let i = 0; i < length; i += 2) {
            vec2Array.push(vec2.fromValues(typedArray[i], typedArray[i + 1]));
        }
        return vec2Array;
    }

    

    private async createMeshesFromObject(objectData: RayTraceObjectData) {
        const size = objectData.size ? objectData.size : 4;
        const indexed_vertices = this.getVerticesFromType(objectData.shape, size);
        const vertices = this.extractIndicesFromTypedArray(indexed_vertices)

        const position = this.createVec3ArrayFromTypedArray(vertices.position);
        const normals = this.createVec3ArrayFromTypedArray(vertices.normal);
        const texcoord = this.createVec2ArrayFromTypedArray(vertices.texcoord);

        const imagedata = await this.createImageDataFromTextureData(objectData.texture);

        const this_position = vec3.fromValues(objectData.position[0], objectData.position[1], objectData.position[2]);

        const reflected = objectData.material == MaterialType.SPECULAR ? true : false;
        const transparent = objectData.material == MaterialType.REFRACTIVE ? true : false;

        const mesh = new Mesh(this_position, reflected, transparent, position, normals, texcoord, imagedata, getWhiteImageData([50, 50, 50]), getWhiteImageData());
        return [mesh];
    }

    private async createMeshesFromRayTraceObjectData(object: RayTraceObjectData) {
        if(object.texture.type == TextureType.FILE) { // read from obj/mtl file
            const three_meshes = await createThreeMeshesFromFileName(object.texture.file!, this.gl);
            return three_meshes;
        } else {
            // create a TWGL mesh
            const mesh = await this.createMeshesFromObject(object);
            return mesh;
        }
    }
    async setScene(raytraceConfig: SceneData, scene: Scene) {
        const camera = scene.camera;
        this.set_camera(raytraceConfig.camera, camera);

        scene.lightPosition = vec3.fromValues(raytraceConfig.light_position[0], raytraceConfig.light_position[1], raytraceConfig.light_position[2]);

        for (let i = 0; i < raytraceConfig.objects.length; i++) {
            const object = raytraceConfig.objects[i];
            const meshes = await this.createMeshesFromRayTraceObjectData(object);
            for(const mesh of meshes) {
                // if type == THREE.Mesh

                if (mesh instanceof Mesh) {
                    scene.addMesh(mesh);
                } else {
                    const this_position = vec3.fromValues(object.position[0], object.position[1], object.position[2]);
                    await scene.addThreeMesh(mesh, this_position);
                }
            }
        }
    }

    extractIndicesFromTypedArray(vertices: { [key: string]: twgl.primitives.TypedArray }): { [key: string]: twgl.primitives.TypedArray} {
        const result = {} as { [key: string]: twgl.primitives.TypedArray };
        // if indices is not provided, return the original vertices
        if(vertices.indices == undefined) {
            return vertices;
        }
        const indices = vertices.indices;
        const position = vertices.position;
        const normal = vertices.normal;
        const texcoord = vertices.texcoord;
        const n_elements = indices.length; // 有这么多个顶点
        const new_position = new Float32Array(n_elements * 3);
        const new_normal = new Float32Array(n_elements * 3);
        const new_texcoord = new Float32Array(n_elements * 2);

        for(let i = 0; i < n_elements; i++) {
            const i0 = indices[i];
            new_position[i * 3] = position[i0 * 3];
            new_position[i * 3 + 1] = position[i0 * 3 + 1];
            new_position[i * 3 + 2] = position[i0 * 3 + 2];
            new_normal[i * 3] = normal[i0 * 3];
            new_normal[i * 3 + 1] = normal[i0 * 3 + 1];
            new_normal[i * 3 + 2] = normal[i0 * 3 + 2];
            new_texcoord[i * 2] = texcoord[i0 * 2];
            new_texcoord[i * 2 + 1] = texcoord[i0 * 2 + 1];
        }
        result.position = new_position;
        result.normal = new_normal;
        result.texcoord = new_texcoord;
        return result;
    }

    async createDrawObjectFromObjectData(objectData: RayTraceObjectData, normalProgramInfo: twgl.ProgramInfo, oitProgramInfo: twgl.ProgramInfo) {
        const normalDrawObjects: twgl.DrawObject[] = []; // for normal objects 
        const oitDrawObjects: twgl.DrawObject[] = []; // for all oit objects

        if(objectData.texture.type == TextureType.FILE) { // read from obj/mtl file
            const three_meshes = await createThreeMeshesFromFileName(objectData.texture.file!, this.gl);
            const twgl_meshes = await createTWGLMeshesFromThreeMeshes(three_meshes, this.gl);
            const this_position = vec3.fromValues(objectData.position[0], objectData.position[1], objectData.position[2]);
            const drawObjects = createDrawObjectsFromTWGLMeshes(twgl_meshes, normalProgramInfo, this_position, this.gl);
            for(const drawObject of drawObjects) {
                normalDrawObjects.push(drawObject);
            }
        } else {
            const size = objectData.size ? objectData.size : 4;
            const indexed_vertices = this.getVerticesFromType(objectData.shape, size);
            const vertices = this.extractIndicesFromTypedArray(indexed_vertices)

            console.log('vertices of generated objects', vertices);

            if(objectData.material == MaterialType.REFRACTIVE) {
                addRandomColor(vertices, 0.5);
            } else {
                addRandomColor(vertices);
            }
            const imageTexture = await this.createWebGLTextureFromTextureData(objectData.texture);

            const getProgramInfo = () => {
                if(objectData.material == MaterialType.REFRACTIVE) {
                    return oitProgramInfo;
                } else {
                    return normalProgramInfo;
                }
            }

            const thisProgramInfo = getProgramInfo();
            const bufferInfo = twgl.createBufferInfoFromArrays(this.gl, vertices);

            const position = vec3.fromValues(objectData.position[0], objectData.position[1], objectData.position[2]);



            const drawObject = {
                programInfo: thisProgramInfo,
                bufferInfo: bufferInfo,
                uniforms: {
                    u_texture: imageTexture,
                    u_specular_texture: getWhiteTexture(this.gl),
                    u_bump_texture: getWhiteTexture(this.gl),
                    u_model_matrix: mat4.translate(mat4.create(), mat4.create(), position),
                    u_is_skybox: objectData.material == MaterialType.SPECULAR ? 1 : 0,
                    u_skybox: getDefaultSkyBox(this.gl),
                }
            }

            if(objectData.material == MaterialType.REFRACTIVE) {
                oitDrawObjects.push(drawObject);
            } else {
                normalDrawObjects.push(drawObject);
            }
        }
        return [normalDrawObjects, oitDrawObjects];
    }

    async setDrawObjects(raytraceConfig: SceneData, normalProgramInfo: twgl.ProgramInfo, oitProgramInfo: twgl.ProgramInfo) {
        const normalDrawObjects: twgl.DrawObject[] = []; // for normal objects 
        const oitDrawObjects: twgl.DrawObject[] = []; // for all oit objects

        for(const object of raytraceConfig.objects) {
            const [normalDrawObjectsFromObject, oitDrawObjectsFromObject] = await this.createDrawObjectFromObjectData(object, normalProgramInfo, oitProgramInfo);
            for(const drawObject of normalDrawObjectsFromObject) {
                normalDrawObjects.push(drawObject);
            }
            for(const drawObject of oitDrawObjectsFromObject) {
                oitDrawObjects.push(drawObject);
            }
        }

        return [normalDrawObjects, oitDrawObjects];
    }

}

export {
    RayTraceConfigReader,
    SceneData,
    RayTraceObjectData,
    ObjectShapeType,
    MaterialType,
    TextureType,
    TextureData
}