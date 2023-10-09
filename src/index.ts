const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gl = canvas.getContext('webgl') as WebGLRenderingContext;


const VERTEX_SHADER_SOURCE = `
    attribute vec4 a_Position;
    void main() {
        gl_Position = a_Position;
    }
`;

const FRAGMENT_SHADER_SOURCE = `
    void main() {
        gl_FragColor = vec4(1.0,0.0,0.0,1.0);;
    }
`;

const program = create_program(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
if (!program) {
    console.log('Failed to create program');
    
}

gl.useProgram(program);

const a_Position = gl.getAttribLocation(program!, 'a_Position');
gl.enableVertexAttribArray(a_Position);

const vertex_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

const size = 2;
const type = gl.FLOAT;
const normalize = false;
const stride = 0;
const offset = 0;

gl.vertexAttribPointer(a_Position, size, type, normalize, stride, offset);

gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);


// functions
function load_shader(ctx: WebGLRenderingContext, type: number, source: string) {
    const shader = ctx.createShader(type);
    if (shader === null) {
        console.log('unable to create shader');
        return null;
    }

    ctx.shaderSource(shader, source);
    ctx.compileShader(shader);

    const compiled = ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);
    if (!compiled) {
        const error = ctx.getShaderInfoLog(shader);
        console.log('Failed to compile shader: ' + error);
        ctx.deleteShader(shader);
        return null;
    }
    return shader;
}

function create_program(ctx: WebGLRenderingContext, vertex_shader_source: string, fragment_shader_source: string) {
    const vertex_shader = load_shader(ctx, ctx.VERTEX_SHADER, vertex_shader_source);
    const fragment_shader = load_shader(ctx, ctx.FRAGMENT_SHADER, fragment_shader_source);

    if (!vertex_shader || !fragment_shader) {
        return null;
    }

    const program = ctx.createProgram();
    if (!program) {
        return null;
    }

    ctx.attachShader(program, vertex_shader);
    ctx.attachShader(program, fragment_shader);

    ctx.linkProgram(program);

    const linked = ctx.getProgramParameter(program, ctx.LINK_STATUS);
    if (!linked) {
        const error = ctx.getProgramInfoLog(program);
        console.log('Failed to link program: ' + error);
        ctx.deleteProgram(program);
        ctx.deleteShader(fragment_shader);
        ctx.deleteShader(vertex_shader);
        return null;
    }

    return program;
}

function draw_circle(x: number, y: number, r:number = 0.01) {
    console.log(x, y);
    const n = 100; // n parts
    
    // fill with triangle fan
    const vertices_data : number[] = [x, y];
    for (let i = 0; i <= n; i++) {
        const theta = 2 * Math.PI / n * i;
        const _x = x + r * Math.cos(theta);
        const _y = y + r * Math.sin(theta);
        vertices_data.push(_x, _y);
    }
    const vertices = new Float32Array(vertices_data);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const primitive_type = gl.TRIANGLE_FAN;
    const offset = 0;
    const count = vertices.length / 2;

    gl.drawArrays(primitive_type, offset, count);

}

function draw_polygon(points: [number, number][]) {
    console.log(points);
    const vertices_data : number[] = [];
    points.forEach(([x, y]) => {
        vertices_data.push(x, y);
    });
    const vertices = new Float32Array(vertices_data);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const primitive_type = gl.LINE_LOOP;
    const offset = 0;
    const count = vertices.length / 2;

    gl.drawArrays(primitive_type, offset, count);
}

const points: [number, number][] = [];


function get_gl_coords(x: number, y: number) {
    const rect = canvas.getBoundingClientRect();
    const width = canvas.width;
    const height = canvas.height;
    const _x = (x - rect.left) / width * 2 - 1;
    const _y = (y - rect.top) / height * -2 + 1;
    return [_x, _y];
}


function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    points.forEach(([x, y]) => {
        draw_circle(x, y);
    });
}

function draw_a() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    draw_polygon(points);
}

canvas.addEventListener('click', (e) => {
    // on left click, add a point
    // on right click, call the draw circle function on all points
    if (e.button === 0) {
        const [x, y] = get_gl_coords(e.clientX, e.clientY);
        points.push([x, y]);
        draw();
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    draw_a();
});