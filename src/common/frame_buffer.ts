import frameBufferToScreenVertex from '../shaders/buffer/framebuffer.vs'
import frameBufferToScreenFragment from '../shaders/buffer/framebuffer.fs'

import * as twgl from 'twgl.js'

export class FrameBufferExporter {
    programInfo: twgl.ProgramInfo;
    gl: WebGL2RenderingContext;
    quadVAO: WebGLVertexArrayObject;
    quadBufferInfo: twgl.BufferInfo;
    framebufferInfo: twgl.FramebufferInfo;
    constructor(gl: WebGL2RenderingContext, frameBuffer: twgl.FramebufferInfo) {
        this.gl = gl;
        this.programInfo = twgl.createProgramInfo(gl, [frameBufferToScreenVertex, frameBufferToScreenFragment]);
        this.quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
        this.quadVAO = twgl.createVAOFromBufferInfo(gl, this.programInfo, this.quadBufferInfo)!;
        this.framebufferInfo = frameBuffer;
    }
    render(canvas: HTMLCanvasElement) {
        // Tell WebGL how to convert from clip space to pixels
        twgl.resizeCanvasToDisplaySize(canvas);
        this.gl.viewport(0, 0, canvas.width, canvas.height);
        
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.useProgram(this.programInfo.program);
        // bind vertex array object
        this.gl.bindVertexArray(this.quadVAO);

        const uniforms = {
            u_screen: this.framebufferInfo.attachments[0],
        };

        // use framebufferInfo.attachments[0] as texture
        twgl.setUniforms(this.programInfo, uniforms);

        // draw
        twgl.drawBufferInfo(this.gl, this.quadBufferInfo);
    }

}