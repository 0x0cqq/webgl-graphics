import * as twgl from 'twgl.js';

function getDefaultSkyBox(gl: WebGL2RenderingContext) {
    return twgl.createTexture(gl, {
        target: gl.TEXTURE_CUBE_MAP,
        src: [
            "./textures/posx.jpg",
            "./textures/negx.jpg",
            "./textures/posy.jpg",
            "./textures/negy.jpg",
            "./textures/posz.jpg",
            "./textures/negz.jpg",
        ],
        min: gl.LINEAR_MIPMAP_LINEAR,
        crossOrigin: ""
    })
}

function getWhiteTexture(gl: WebGL2RenderingContext, color: number[] = [255, 255, 255, 255]) {
    return twgl.createTexture(gl, {
        minMag: gl.NEAREST,
        src: new Uint8Array(color),
    });
}

function getWhiteImageData(color: number[] = [255, 255, 255, 255]) {
    const data = new ImageData(1, 1);
    data.data[0] = color[0];
    data.data[1] = color[1];
    data.data[2] = color[2];
    data.data[3] = color[3];
    return data;
}


function myDrawObjectList(gl: WebGL2RenderingContext, objectsToDraw: twgl.DrawObject[]) {
    for(const object of objectsToDraw) {
        twgl.createVAOFromBufferInfo(gl, object.programInfo, object.bufferInfo!)
        gl.useProgram(object.programInfo.program);
        twgl.setUniforms(object.programInfo, object.uniforms);
        twgl.setBuffersAndAttributes(gl, object.programInfo, object.bufferInfo!);
        twgl.drawBufferInfo(gl, object.bufferInfo!);
    }
}

export {
    getDefaultSkyBox,
    getWhiteTexture,
    getWhiteImageData,
    myDrawObjectList,
}