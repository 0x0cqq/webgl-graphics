import * as twgl from "twgl.js";

import { DrawObject } from "../draw_object";
import { Camera } from "../camera";


export abstract class BasicObject implements DrawObject {
    gl: WebGL2RenderingContext;
    programInfo: twgl.ProgramInfo;

    protected constructor(gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
        this.gl = gl;
        this.programInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);
    }

    abstract render(camera: Camera, canvas: HTMLCanvasElement): void;
}