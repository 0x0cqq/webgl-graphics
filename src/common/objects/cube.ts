import { mat4, vec3 } from "gl-matrix";
import * as twgl from "twgl.js";

import { Camera } from "../camera";

import vertexShaderSource from "../../shaders/cube/cube.vs";
import fragmentShaderSource from "../../shaders/cube/cube.fs";
import { BasicObject } from "./basic_object";

export class Cube extends BasicObject {
    position: vec3;
    cubeBuffer: twgl.BufferInfo;
    cubeVAO: WebGLVertexArrayObject;
    constructor(gl: WebGL2RenderingContext, position: vec3) {
        super(gl, vertexShaderSource, fragmentShaderSource);
        this.position = position;
        this.cubeBuffer = twgl.primitives.createCubeBufferInfo(gl, 1);
        this.cubeVAO = twgl.createVAOFromBufferInfo(gl, this.programInfo, this.cubeBuffer)!;
    }

    setPosition(position: vec3) {
        this.position = position;
    }

    render(camera: Camera, canvas: HTMLCanvasElement): void {
        // set View Matrix from Camera
        // Make a view matrix from the camera matrix.
        // turn on depth testing & tell webgl to cull faces
        const gl = this.gl;
        gl.enable(gl.DEPTH_TEST);
        const viewMatrix = mat4.multiply(mat4.create(), camera.get_projection_matrix(canvas.width, canvas.height), camera.get_view_matrix());
        gl.depthFunc(gl.LESS);
        gl.useProgram(this.programInfo.program);
        gl.bindVertexArray(this.cubeVAO);

        const uniforms = {
            u_colorMult: [1, 0, 0, 1],
            u_matrix: viewMatrix,
            u_world_matrix: mat4.fromTranslation(mat4.create(), this.position),
            u_color: [1, 1, 1, 1],
        };

        twgl.setUniforms(this.programInfo, uniforms);

        twgl.drawBufferInfo(gl, this.cubeBuffer);
    }
}