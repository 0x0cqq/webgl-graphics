import { mat4, vec3, vec4 } from "gl-matrix";
import * as twgl from "twgl.js";

import { Camera } from "../camera";

import vertexShaderSource from "../../shaders/cube/cube.vs";
import fragmentShaderSource from "../../shaders/cube/cube.fs";
import { BasicObject } from "./basic_object";

export class Cube extends BasicObject {
    position: vec3;
    cubeBuffer: twgl.BufferInfo;
    cubeVAO: WebGLVertexArrayObject;
    texture: WebGLTexture;
    color: vec3;
    constructor(gl: WebGL2RenderingContext, position: vec3, texture: WebGLTexture | null, color: vec3 = vec3.fromValues(1, 1, 1)) {
        let last = 0;
        super(gl, vertexShaderSource, fragmentShaderSource);
        this.position = position;
        const vertices = twgl.primitives.createCubeVertices(1);
        console.log(vertices)
        this.cubeBuffer = twgl.createBufferInfoFromArrays(gl, vertices);
        this.cubeVAO = twgl.createVAOFromBufferInfo(gl, this.programInfo, this.cubeBuffer)!;
        if(texture == null) {
            const textureOptions = {
                min: gl.NEAREST,
                mag: gl.NEAREST,
                src: [
                    255, 255, 255, 255,
                    255, 255, 255, 255,
                    255, 255, 255, 255,
                    255, 255, 255, 255,
                ],
            };
            this.texture = twgl.createTexture(gl, textureOptions)
        } else {
            this.texture = texture;
        }
        this.color = color;
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
            u_matrix: viewMatrix,
            u_world_matrix: mat4.fromTranslation(mat4.create(), this.position),
            u_color: vec4.fromValues(this.color[0], this.color[1], this.color[2], 1),
            u_diffuse: this.texture,
        };

        twgl.setUniforms(this.programInfo, uniforms);

        twgl.drawBufferInfo(gl, this.cubeBuffer);
    }
}