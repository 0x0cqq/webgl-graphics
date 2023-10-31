import { vec2, vec3 } from "gl-matrix";
import { Camera } from "./camera";
import { CollisionTest } from "./collision_test";
import { BasicObject } from "./objects/basic_object";
import { Ball } from "./objects/ball";
import { Cube } from "./objects/cube";

import * as twgl from "twgl.js";


interface ObjectData {
    type: string;
    position: number[]; // vec3
    speed: number[]; // vec3
    size: number;
    isMovable: boolean;
    color: number[]; // vec3
}

interface BoundaryData {
    x: number[]; // vec2
    y: number[]; // vec2
    z: number[]; // vec2
}

interface CameraData {
    position: number[]; // vec3
    angle: number[]; // yaw + pitch
    zoom: number;
}

interface ConfigData {
    objects: ObjectData[];
    boundary: BoundaryData;
    camera: CameraData;
}


class ConfigReader {
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
    load(file: File): Promise<ConfigData> {
        return new Promise((resolve, reject) => {
            this.readFile(file).then((data) => {
                try {
                    const config_data = JSON.parse(data) as ConfigData;
                    resolve(config_data);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    set_camera(cameraData: CameraData, camera: Camera) {
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

    set_boundary(boundary: BoundaryData, collisionTest: CollisionTest) {
        if (boundary.x.length != 2) {
            alert("Boundary x should be a 2D vector");
            return;
        }
        if (boundary.y.length != 2) {
            alert("Boundary y should be a 2D vector");
            return;
        }
        if (boundary.z.length != 2) {
            alert("Boundary z should be a 2D vector");
            return;
        }
        const vec_x = vec2.fromValues(boundary.x[0], boundary.x[1]);
        const vec_y = vec2.fromValues(boundary.y[0], boundary.y[1]);
        const vec_z = vec2.fromValues(boundary.z[0], boundary.z[1]);
        collisionTest.set_boundary([vec_x, vec_y, vec_z]);
    }

    set_objects(object_datas: ObjectData[], collisionTest: CollisionTest) {
        const new_objects : BasicObject[] = [];
        collisionTest.clearObjects();
        object_datas.forEach(object_data => {
            if (object_data.position.length != 3) {
                alert("Object position should be a 3D vector");
                return;
            }
            if (object_data.speed.length != 3) {
                alert("Object speed should be a 3D vector");
                return;
            }
            if (object_data.color.length != 3) {
                alert("Object color should be a 3D vector");
                return;
            }
            if (object_data.size <= 0) {
                alert(`Object size should be positive, but got ${object_data.size}`);
                return;
            }
            const position = vec3.fromValues(object_data.position[0], object_data.position[1], object_data.position[2]);
            const speed = vec3.fromValues(object_data.speed[0], object_data.speed[1], object_data.speed[2]);
            const color = vec3.fromValues(object_data.color[0], object_data.color[1], object_data.color[2]);
            if (object_data.type == "ball") {
                const object = new Ball(this.gl, position, speed, object_data.size, color, object_data.isMovable);
                new_objects.push(object);
                collisionTest.addObject(object);
            } else if (object_data.type == "cube") {
                const cubeTexture = twgl.createTexture(this.gl, {
                    min: this.gl.NEAREST,
                    mag: this.gl.NEAREST,
                    src: [
                        255, 255, 255, 255,
                        192, 192, 192, 255,
                        192, 192, 192, 255,
                        255, 255, 255, 255,
                    ],
                });
                const object = new Cube(this.gl, position, speed, object_data.size, color, object_data.isMovable, cubeTexture);
                new_objects.push(object);
                collisionTest.addObject(object);
            } else {
                alert(`Unknown object type ${object_data.type}`);
            }
        });
        return new_objects;
    }
};

export {
    ConfigReader,
    ConfigData,
    ObjectData,
    BoundaryData,
    CameraData,
}