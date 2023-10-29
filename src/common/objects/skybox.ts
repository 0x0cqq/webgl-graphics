import * as twgl from "twgl.js";
import { mat4, vec3 } from "gl-matrix";

import skyboxVertexShaderSource from "../../shaders/skybox/skybox.vs";
import skyboxFragmentShaderSource from "../../shaders/skybox/skybox.fs";
import { Camera } from "../camera";
import { DrawObject } from "../draw_object";


export class SkyBox implements DrawObject {
    gl: WebGL2RenderingContext;
    programInfo: twgl.ProgramInfo;
    skyboxTexture: WebGLTexture;
    quadBufferInfo: twgl.BufferInfo;
    quadVAO: WebGLVertexArrayObject;
    constructor(gl: WebGL2RenderingContext, skyboxTexture: WebGLTexture) {
        this.gl = gl;
        this.skyboxTexture = skyboxTexture;
        this.programInfo = twgl.createProgramInfo(gl, [skyboxVertexShaderSource, skyboxFragmentShaderSource]);
        this.quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
        this.quadVAO = twgl.createVAOFromBufferInfo(gl, this.programInfo, this.quadBufferInfo)!;
    }
    render(camera: Camera, canvas: HTMLCanvasElement) {
        // 这里要用 Camera Matrix，所以需要把 ViewMatrix 反过来用
        const skyboxCameraMatrix = mat4.invert(mat4.create(), camera.get_view_matrix());
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.useProgram(this.programInfo.program);
        this.gl.bindVertexArray(this.quadVAO);


        var viewDirectionMatrix = mat4.copy(mat4.create(), skyboxCameraMatrix);
        viewDirectionMatrix[12] = 0;
        viewDirectionMatrix[13] = 0;
        viewDirectionMatrix[14] = 0;
    
        var viewDirectionProjection = mat4.multiply(mat4.create(), camera.get_projection_matrix(canvas.width, canvas.height), viewDirectionMatrix);    
        var viewDirectionProjectionInv = mat4.invert(mat4.create(), viewDirectionProjection);

        twgl.setUniforms(this.programInfo, {
          u_viewDirectionProjectionInverse: viewDirectionProjectionInv,
          u_skybox: this.skyboxTexture,
        });
        twgl.drawBufferInfo(this.gl, this.quadBufferInfo); 
    }
}