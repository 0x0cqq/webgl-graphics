// this is the accumlator for Weighted Blended Order-Independent Transparency
// reference code: https://github.com/tsherif/webgl2examples/blob/master/oit.html
import vertexShaderSource from '../shaders/accum/accum.vs'
import fragmentShaderSource from '../shaders/accum/accum.fs'
import fragmentNoOITShaderSource from '../shaders/accum/accum_no_oit.fs'

import renderVertexShaderSource from '../shaders/accum/quad.vs'
import renderFragmentShaderSource from '../shaders/accum/quad.fs'


import * as twgl from "twgl.js";
import { Camera } from './camera';
import { mat4, vec3, vec4 } from 'gl-matrix';

import { FramebufferExporter } from './frame_buffer'



function createImmutableTexture(gl: WebGL2RenderingContext, type: number) : WebGLTexture {
    const texture = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    twgl.setTextureParameters(gl, texture, {
        minMag: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE,
    });

    gl.texStorage2D(gl.TEXTURE_2D, 1, type, gl.drawingBufferWidth, gl.drawingBufferHeight);

    return texture;
}

export class Accumlator {
    gl: WebGL2RenderingContext;
    normalprogramInfo: twgl.ProgramInfo;
    normalFramebufferInfo: twgl.FramebufferInfo;
    // the accumlator buffer & program
    oitProgramInfo: twgl.ProgramInfo;
    oitFramebufferInfo: twgl.FramebufferInfo;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        // depth for both OIT and non-OIT part
        const texture_depth = createImmutableTexture(gl, gl.DEPTH_COMPONENT16);
        const texture_depth2 = createImmutableTexture(gl, gl.DEPTH_COMPONENT16);
        
        // for none OIT part
        this.normalprogramInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentNoOITShaderSource]);
        const texture_normal = createImmutableTexture(gl, gl.RGBA8);
        
        const attachments_normal: twgl.AttachmentOptions[] = [
            {
                attachment: texture_normal, attachmentPoint: gl.COLOR_ATTACHMENT0,
            },
            { 
                attachment: texture_depth, attachmentPoint: gl.DEPTH_ATTACHMENT,
            }
        ];

        this.normalFramebufferInfo = twgl.createFramebufferInfo(gl, attachments_normal);
        let status_normal = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status_normal != gl.FRAMEBUFFER_COMPLETE) {
            alert("frame buffer is not complete!");
        }

        
        // for OIT part
        this.oitProgramInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);
        const texture_accumcolor = createImmutableTexture(gl, gl.RGBA16F);
        const texture_accumalpha = createImmutableTexture(gl, gl.R16F);
    
        const attachments_oit: twgl.AttachmentOptions[] = [
            {
                attachment: texture_accumcolor, attachmentPoint: gl.COLOR_ATTACHMENT0,
            },
            {
                attachment: texture_accumalpha, attachmentPoint: gl.COLOR_ATTACHMENT1,
            },
            {
                attachment: texture_depth, attachmentPoint: gl.DEPTH_ATTACHMENT,
            }
        ];

        this.oitFramebufferInfo = twgl.createFramebufferInfo(gl, attachments_oit);
        let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status != gl.FRAMEBUFFER_COMPLETE) {
            alert("frame buffer is not complete!");
        }

        twgl.bindFramebufferInfo(gl, null);
    }

    // the inner render only need to provide the data 
    render(canvas: HTMLCanvasElement, camera: Camera, light_position: vec3, normal_render: (programInfo: twgl.ProgramInfo) => void, oit_render: (programInfo: twgl.ProgramInfo) => void) {
        const eye_position = camera.get_eye_position();
        const view_matrix = camera.get_view_matrix();
        const project_matrix = camera.get_projection_matrix(canvas.width, canvas.height);
        const view_proj_matrix = mat4.multiply(mat4.create(), project_matrix, view_matrix);
    
        // basic view/light uniform for the vertex & fragment shader
        const uniforms = {  
            u_view_proj: view_proj_matrix,
            u_eye_position: eye_position,
            u_light_position: light_position,
        };
        
        
        // 1. render for the none OIT part: draw to the normal frame buffer
        twgl.bindFramebufferInfo(this.gl, this.normalFramebufferInfo);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthMask(true);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.useProgram(this.normalprogramInfo.program);
        twgl.setUniforms(this.normalprogramInfo, uniforms);
        // enable depth test & write
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.disable(this.gl.BLEND);

        normal_render(this.normalprogramInfo);

        // 2. render for the OIT part: draw to the accumlator frame buffer
        twgl.bindFramebufferInfo(this.gl, this.oitFramebufferInfo);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.oitProgramInfo.program);
        // do not clear the depth buffer
        twgl.setUniforms(this.oitProgramInfo, uniforms);
    
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.depthMask(false);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFuncSeparate(this.gl.ONE, this.gl.ONE, this.gl.ZERO, this.gl.ONE_MINUS_SRC_ALPHA);
        
        oit_render(this.oitProgramInfo) 

    }
}


export class AccumlatorExporter {
    gl: WebGL2RenderingContext;

    // this is the quad for the frame buffer to the screen
    normal_exporter: FramebufferExporter;

    // This is the quad buffer from the frame buffer to the screen
    renderer: twgl.ProgramInfo;
    quadVAO: WebGLVertexArrayObject;
    quadBufferInfo: twgl.BufferInfo;
    accumlator: Accumlator;
    

    constructor(gl: WebGL2RenderingContext, accumlator: Accumlator) {
        this.gl = gl;
        this.renderer = twgl.createProgramInfo(gl, [renderVertexShaderSource, renderFragmentShaderSource]);

        this.quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
        this.quadVAO = twgl.createVAOFromBufferInfo(gl, this.renderer, this.quadBufferInfo)!;

        this.accumlator = accumlator;

        // create a framebuffer exporter for normal render
        this.normal_exporter = new FramebufferExporter(gl, this.accumlator.normalFramebufferInfo);
        
    }

    render(canvas: HTMLCanvasElement) {
        
        twgl.bindFramebufferInfo(this.gl, null);
        twgl.resizeCanvasToDisplaySize(canvas);
        
        this.gl.viewport(0, 0, canvas.width, canvas.height);
        this.gl.depthMask(true);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // render the normal part
        this.normal_exporter.render(canvas, false);
        
        // render the accumlator part
        const accum_framebuffer = this.accumlator.oitFramebufferInfo;
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.useProgram(this.renderer.program);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        
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