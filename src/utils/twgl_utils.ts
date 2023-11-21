import * as twgl from 'twgl.js';

export function getWhiteTexture(gl: WebGL2RenderingContext) {
    return twgl.createTexture(gl, {
        minMag: gl.NEAREST,
        src: new Uint8Array([255, 255, 255, 255]),
    });
}


export function myDrawObjectList(gl: WebGL2RenderingContext, objectsToDraw: twgl.DrawObject[]) {
    for(const object of objectsToDraw) {
        twgl.createVAOFromBufferInfo(gl, object.programInfo, object.bufferInfo!)
        gl.useProgram(object.programInfo.program);
        twgl.setUniforms(object.programInfo, object.uniforms);
        twgl.setBuffersAndAttributes(gl, object.programInfo, object.bufferInfo!);
        twgl.drawBufferInfo(gl, object.bufferInfo!);
    }
}