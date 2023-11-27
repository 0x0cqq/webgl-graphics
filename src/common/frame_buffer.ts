import frameBufferToScreenVertex from '../shaders/buffer/framebuffer.vs'
import frameBufferToScreenFragmentRaw from '../shaders/buffer/framebuffer_raw.fs'
// Grey, Reverse, Guass, Vignette
import frameBufferToScreenFragmentGrey from '../shaders/buffer/framebuffer_grey.fs'
import frameBufferToScreenFragmentReverse from '../shaders/buffer/framebuffer_reverse.fs'
import frameBufferToScreenFragmentGuass from '../shaders/buffer/framebuffer_guass.fs'
import frameBufferToScreenFragmentVignette from '../shaders/buffer/framebuffer_vignette.fs'

import * as twgl from 'twgl.js'
import { myDrawObjectList } from './utils/twgl_utils'

export enum FrameBufferType {
    Raw,
    Grey,
    Reverse,
    Guass,
    Vignette,
}

const fragments = [
    frameBufferToScreenFragmentRaw,
    frameBufferToScreenFragmentGrey,
    frameBufferToScreenFragmentReverse,
    frameBufferToScreenFragmentGuass,
    frameBufferToScreenFragmentVignette,
]

export class FramebufferExporter {
    programInfo: twgl.ProgramInfo;
    gl: WebGL2RenderingContext;
    quadBufferInfo: twgl.BufferInfo;
    framebufferInfo: twgl.FramebufferInfo;
    currentType: FrameBufferType = FrameBufferType.Raw;

    constructor(gl: WebGL2RenderingContext, frameBuffer: twgl.FramebufferInfo, type: FrameBufferType = FrameBufferType.Raw) {
        this.gl = gl;
        this.programInfo = twgl.createProgramInfo(gl, [frameBufferToScreenVertex, fragments[type]]);
        this.quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
        this.framebufferInfo = frameBuffer;
    }

    recreate(type: FrameBufferType = FrameBufferType.Raw) {
        this.programInfo = twgl.createProgramInfo(this.gl, [frameBufferToScreenVertex, fragments[type]]);
        this.currentType = type;
    }

    render(canvas: HTMLCanvasElement, standalone: boolean = true) {
        // Tell WebGL how to convert from clip space to pixels
        
        if (standalone) {
            twgl.resizeCanvasToDisplaySize(canvas);
            this.gl.viewport(0, 0, canvas.width, canvas.height);
            this.gl.clearColor(0, 0, 0, 1.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        }

        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.BLEND);
        this.gl.useProgram(this.programInfo.program);

        const uniforms = {
            u_screen: this.framebufferInfo.attachments[0],
        };

        const drawObject = {
            programInfo: this.programInfo,
            bufferInfo: this.quadBufferInfo,
            uniforms: uniforms,
        }
        myDrawObjectList(this.gl, [drawObject]);
    }

}