import * as twgl from 'twgl.js';


export function createImmutableImageTexture(gl: WebGL2RenderingContext, image: HTMLImageElement): WebGLTexture {
    const texture = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    twgl.setTextureParameters(gl, texture, {
        mag: gl.LINEAR,
        min: gl.LINEAR_MIPMAP_LINEAR,
        wrap: gl.REPEAT,
    });

    const levels = Math.floor(Math.log2(Math.max(image.width, image.height))) + 1;

    gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, image.width, image.height);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, image.width, image.height, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);

    return texture;
}
