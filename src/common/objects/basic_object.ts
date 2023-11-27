import * as twgl from "twgl.js";

import { DrawObject } from "./draw_object";
import { Camera } from "../camera";
import { vec2, vec3, vec4 } from "gl-matrix";


export abstract class BasicObject implements DrawObject {
    position: vec3 = vec3.create();
    speed: vec3 = vec3.create();
    color: vec3;
    size: number;


    enableCollision: boolean = true;
    enableMove: boolean = true;

    gl: WebGL2RenderingContext;
    programInfo: twgl.ProgramInfo;

    protected constructor(gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string, position: vec3, speed: vec3, color: vec3, size: number, enableCollision: boolean, enableMove: boolean) {
        this.gl = gl;
        this.programInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);
        this.position = position;
        this.speed = speed;
        this.enableCollision = enableCollision;
        this.enableMove = enableMove;
        this.color = color;
        this.size = size;
    }

    abstract render(camera: Camera, canvas: HTMLCanvasElement): void;

    // every vec2 bounds a dimension of the AABB box
    // there should be 3 vec2s in the array (min and max for x, y, z)
    abstract getAABBBox(): vec2[];

    updatePosition(deltaTime: number) {
        if (!this.enableMove) {
            return;
        }
        vec3.scaleAndAdd(this.position, this.position, this.speed, deltaTime);
    }
}

function isCollidingInOneDimension(a: vec2, b: vec2): boolean {
    return a[0] <= b[1] && a[1] >= b[0];
}

export function isColliding(a: BasicObject, b: BasicObject): boolean[] {
    const aabbA = a.getAABBBox();
    const aabbB = b.getAABBBox();
    const result = [false, false, false];

    for(let i = 0; i < 3; i++) {
        result[i] = isCollidingInOneDimension(aabbA[i], aabbB[i]);
    }

    return result;
}