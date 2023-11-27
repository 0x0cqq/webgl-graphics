// 要求能配置模型的位置、纹理和材质、点光源的位置。

import { vec2, vec3 } from "gl-matrix";
import { CameraData } from "./config";
import { Camera } from "../camera";
import { Mesh, Scene } from "../raytracer";
import { createThreeMeshesFromFileName } from '../meshs/mesh_three';
import { TWGLMesh } from "../meshs/mesh_twgl";
import * as THREE from "three";
import * as twgl from "twgl.js";
import { getWhiteImageData, getWhiteTexture } from "../utils/twgl_utils";
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

    private getVerticesFromType(shape: ObjectShapeType): { [key: string]: twgl.primitives.TypedArray } {
        if (shape == ObjectShapeType.SPHERE) {
            return twgl.primitives.createSphereVertices(4, 32, 32);
        } else if (shape == ObjectShapeType.CUBE) {
            return twgl.primitives.createCubeVertices(4);
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
        const vertices = this.getVerticesFromType(objectData.shape);
        const position = this.createVec3ArrayFromTypedArray(vertices.position);
        const normals = this.createVec3ArrayFromTypedArray(vertices.normal);
        const texcoord = this.createVec2ArrayFromTypedArray(vertices.texcoord);

        const imagedata = await this.createImageDataFromTextureData(objectData.texture);

        const mesh = new Mesh(position, normals, texcoord, imagedata, getWhiteImageData(), getWhiteImageData());
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
    async set_scene(raytraceConfig: SceneData, scene: Scene) {
        const camera = scene.camera;
        this.set_camera(raytraceConfig.camera, camera);

        scene.lightPosition = vec3.fromValues(raytraceConfig.light_position[0], raytraceConfig.light_position[1], raytraceConfig.light_position[2]);

        for (let i = 0; i < raytraceConfig.objects.length; i++) {
            const object = raytraceConfig.objects[i];
            const meshes = await this.createMeshesFromRayTraceObjectData(object);
            for(const mesh of meshes) {
                // if type == THREE.Mesh
                if(mesh instanceof THREE.Mesh) {
                    await scene.addThreeMesh(mesh);
                } 
                else if (mesh instanceof Mesh) {
                    scene.addMesh(mesh);
                } else {
                    console.error("Unknown mesh type");
                }
            }
        }

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