// this is the accumlator for Weighted Blended Order-Independent Transparency
// reference code: https://github.com/tsherif/webgl2examples/blob/master/oit.html
import vertexShaderSource from '../shaders/accum/accum.vs'
import fragmentShaderSource from '../shaders/accum/accum.fs'

import renderVertexShaderSource from '../shaders/accum/quad.vs'
import renderFragmentShaderSource from '../shaders/accum/quad.fs'


import * as twgl from "twgl.js";
import { Camera } from './camera';
import { mat4, vec3, vec4 } from 'gl-matrix';

export class Accumlator {
    gl: WebGL2RenderingContext;
    // the accumlator buffer & program
    programInfo: twgl.ProgramInfo;
    framebufferInfo: twgl.FramebufferInfo;

    constructor(gl: WebGL2RenderingContext, accum_framebuffer: twgl.FramebufferInfo) {
        this.gl = gl;
        this.programInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);
        this.framebufferInfo = accum_framebuffer;

    }

    // the inner render only need to provide the data 
    render(canvas: HTMLCanvasElement, camera: Camera, lightPosition: vec3, inner_render: (programInfo: twgl.ProgramInfo) => void) {
        const eye_position = camera.get_eye_position();
        const view_matrix = camera.get_view_matrix();
        const project_matrix = camera.get_projection_matrix(canvas.width, canvas.height);
        const view_proj_matrix = mat4.multiply(mat4.create(), project_matrix, view_matrix);
    
        // basic view/light uniform for the vertex & fragment shader
        const uniforms = { 
            u_view_proj: view_proj_matrix,
            u_eye_position: eye_position,
            u_light_position: lightPosition,
        };

        // draw to the accumlator frame buffer
        twgl.bindFramebufferInfo(this.gl, this.framebufferInfo);
        
        // use the accumlator program
        this.gl.useProgram(this.programInfo.program);


        twgl.setUniforms(this.programInfo, uniforms);

        this.gl.blendFuncSeparate(this.gl.ONE, this.gl.ONE, this.gl.ZERO, this.gl.ONE_MINUS_SRC_ALPHA);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        inner_render(this.programInfo) // render the scene, do something like twgl.drawBufferInfo

    }
}


export class AccumlatorExporter {
    gl: WebGL2RenderingContext;


    // This is the quad buffer from the frame buffer to the screen
    renderer: twgl.ProgramInfo;
    quadVAO: WebGLVertexArrayObject;
    quadBufferInfo: twgl.BufferInfo;



    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.renderer = twgl.createProgramInfo(gl, [renderVertexShaderSource, renderFragmentShaderSource]);

        this.quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
        this.quadVAO = twgl.createVAOFromBufferInfo(gl, this.renderer, this.quadBufferInfo)!;

    }

    render(canvas: HTMLCanvasElement, accum_framebuffer: twgl.FramebufferInfo) {
        twgl.bindFramebufferInfo(this.gl, null);
        twgl.resizeCanvasToDisplaySize(canvas);

        
        this.gl.viewport(0, 0, canvas.width, canvas.height);

        this.gl.clearColor(0, 0, 0, 1); // note the alpha here is 1
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);

        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.useProgram(this.renderer.program);

        // bind vertex array object
        this.gl.bindVertexArray(this.quadVAO);

        const uniforms = {
            u_accumulate: accum_framebuffer.attachments[0],
            u_accumulate_alpha: accum_framebuffer.attachments[1],
        };

        twgl.setUniforms(this.renderer, uniforms);

        twgl.drawBufferInfo(this.gl, this.quadBufferInfo);
    }

}