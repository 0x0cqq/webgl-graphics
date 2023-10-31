import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import * as twgl from "twgl.js";

import { Camera } from "../camera";

import vertexShaderSource from "../../shaders/ball/ball.vs";
import fragmentShaderSource from "../../shaders/ball/ball.fs";
import { BasicObject } from "./basic_object";

export class Ball extends BasicObject {
    ballBuffer: twgl.BufferInfo;
    ballVAO: WebGLVertexArrayObject;
    constructor(gl: WebGL2RenderingContext, position: vec3, speed: vec3, size: number, color: vec3 = vec3.fromValues(1, 1, 1), enableMove: boolean = true) {
        super(gl, vertexShaderSource, fragmentShaderSource, position, speed, color, size, true, enableMove);
        const vertices = twgl.primitives.createSphereVertices(size / 2, 8, 6);
        // generate random colors for each vertex
        let colors = [];
        for(let i = 0; i < vertices.position.length; i += 3) {
            const grey = Math.random() * 0.5 + 0.5;
            colors.push(color[0] * grey, color[1] * grey, color[2] * grey, 1);
        }
        // transform vertices to typed array
        vertices.color = new Float32Array(colors);
        console.log(vertices)
        this.ballBuffer = twgl.createBufferInfoFromArrays(gl, vertices);
        this.ballVAO = twgl.createVAOFromBufferInfo(gl, this.programInfo, this.ballBuffer)!;
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
        gl.bindVertexArray(this.ballVAO);

        const uniforms = {
            u_matrix: viewMatrix,
            u_world_matrix: mat4.fromTranslation(mat4.create(), this.position),
            u_color: vec4.fromValues(this.color[0], this.color[1], this.color[2], 1),
        };

        twgl.setUniforms(this.programInfo, uniforms);
        twgl.drawBufferInfo(gl, this.ballBuffer);
    }

    getAABBBox(): vec2[] {
        const halfSize = this.size / 2;
        return [
            vec2.fromValues(this.position[0] - halfSize, this.position[0] + halfSize),
            vec2.fromValues(this.position[1] - halfSize, this.position[1] + halfSize),
            vec2.fromValues(this.position[2] - halfSize, this.position[2] + halfSize),
        ];   
    }
}