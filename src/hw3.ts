import { mat4, vec3 } from 'gl-matrix';
import * as twgl from 'twgl.js';
import { Camera } from './common/camera';

import { Accumlator, AccumlatorExporter } from './common/accumlator';
import { RayTracer, Scene } from './common/raytracer';
import { RayTraceConfigReader } from './common/configs/ray_trace_config';
import { myDrawObjectList } from './common/utils/twgl_utils';

function do_raytracing(rayTracer: RayTracer, percent_callback: (percent: number) => void = (percent: number) => {}) {
    const imageData = rayTracer.do_raytracing(200, 200, (percent: number) => {
        percent_callback(percent);
    });


    console.log(imageData);
    // output data to canvas
    const raytraceCanvas = document.querySelector("#raytrace") as HTMLCanvasElement;
    const raytraceContext = raytraceCanvas.getContext("2d")!;
    raytraceCanvas.style.width = imageData.width + "px";
    raytraceCanvas.style.height = imageData.height + "px";
    raytraceCanvas.width = imageData.width;
    raytraceCanvas.height = imageData.height;

    // get image
    raytraceContext.putImageData(imageData, 0, 0);
}

async function main() {
    // Get A WebGL context
    const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    // resize canvas to displaying size
    twgl.resizeCanvasToDisplaySize(canvas);

    if (!gl) {
        alert("No WebGL2! Please use a newer browser.");
        return;
    }

    if (!gl.getExtension("EXT_color_buffer_float")) {
        alert("FLOAT color buffer not available");
        return;
    }

    twgl.setDefaults({ attribPrefix: "a_" });

    // Config Loader
    const config_reader = new RayTraceConfigReader(gl);
    const config_button = document.querySelector("#load_config") as HTMLButtonElement;
    const config_file_input = document.querySelector("#config") as HTMLInputElement;
    
    const camera = new Camera(vec3.fromValues(0.0, 8.0, 80.0));
    camera.setup_interaction(canvas);

    let lightPosition = vec3.fromValues(0, 0, 20);

    const scene = new Scene(camera, lightPosition);


    let normalDrawObjects: twgl.DrawObject[] = [];
    let oitDrawObjects: twgl.DrawObject[] = [];

    config_button.addEventListener('click', async function (e) {
        if (config_file_input.files == null) {
            return;
        }
        if (config_file_input.files.length == 0) {
            alert("Please select a config file");
            return;
        }
        const config_file = config_file_input.files[0];
        const config_data = await config_reader.load(config_file)
        console.log(config_data);
        config_reader.set_scene(config_data, scene)
    });



    const rayTracer = new RayTracer(scene, 1, 1);

    // accumlator and exporter
    const accumlator = new Accumlator(gl);
    const accum_exporter = new AccumlatorExporter(gl, accumlator);

    // color, depth and stencil
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    const button = document.querySelector("#render") as HTMLButtonElement;
    const progress_span = document.querySelector("#progress") as HTMLSpanElement;

    button.onclick = () => {
        do_raytracing(rayTracer, (percent: number) => {
            progress_span.innerHTML = percent.toFixed(2) + "%";
        });
    }

    function render(time: number) {
        time *= 0.001;

        // resize canvas to displaying size
        twgl.resizeCanvasToDisplaySize(canvas);

        accumlator.render(canvas, camera, lightPosition,
            // normal render
            (programInfo: twgl.ProgramInfo) => {
                twgl.setUniforms(programInfo, {
                    u_model_matrix: mat4.create(),
                });
                myDrawObjectList(gl, normalDrawObjects);

            },
            // oit render
            (programInfo: twgl.ProgramInfo) => {
                twgl.setUniforms(programInfo, {
                    u_model_matrix: mat4.create(),
                });
                myDrawObjectList(gl, oitDrawObjects);
            });

        // render frame buffer to screen
        accum_exporter.render(canvas);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    console.log("ready.")
}




main()
