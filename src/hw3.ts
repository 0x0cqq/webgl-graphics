import { mat4, vec3 } from 'gl-matrix';
import * as twgl from 'twgl.js';
import { Camera } from './common/camera';

import { Accumlator, AccumlatorExporter } from './common/accumlator';
import { RayTracer, Scene } from './common/raytracer';
import { RayTraceConfigReader } from './common/configs/ray_trace_config';
import { myDrawObjectList } from './common/utils/twgl_utils';
import RayTraceWorker from './common/workers/ray_trace.worker';


function do_raytracing(rayTracer: RayTracer, percent_callback: (percent: number) => void = (percent: number) => {}) {

    const worker = new RayTraceWorker('');
    worker.postMessage('主线程对子线程说:你老婆真棒');
    worker.onmessage = function (evt: any) {
        // 主线程收到工作线程的消息
        console.log('主线程收到', evt)
    };
    worker.addEventListener('error', function (e: any) {
        console.log('MAIN: ', 'ERROR', e);
        console.log('filename:' + e.filename + '-message:' + e.message + '-lineno:' + e.lineno);
    });

    return

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
        config_reader.setScene(config_data, scene)
        const [o1, o2] = await config_reader.setDrawObjects(config_data, accumlator.normalprogramInfo, accumlator.oitProgramInfo);
        normalDrawObjects = o1;
        oitDrawObjects = o2;
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
                myDrawObjectList(gl, normalDrawObjects);
            },
            // oit render
            (programInfo: twgl.ProgramInfo) => {
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
