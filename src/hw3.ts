import { vec3 } from 'gl-matrix';
import * as twgl from 'twgl.js';
import { Camera } from './common/camera';


function main() {
    // Get A WebGL context
    const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    // resize canvas to displaying size
    twgl.resizeCanvasToDisplaySize(canvas);

    if (!gl) {
        alert("No WebGL2! Please use a newer browser.");
        return;
    }

    const camera = new Camera(vec3.fromValues(0.0, 0.0, 15.0));

}

main()