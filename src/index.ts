const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gl = canvas.getContext('webgl') as WebGLRenderingContext;

const eps = 1e-6;

const VERTEX_SHADER_SOURCE = `
    attribute vec4 a_Position;
    void main() {
        gl_Position = a_Position;
    }
`;

const FRAGMENT_SHADER_SOURCE = `
    precision mediump float;
    uniform vec3 my_color;
    void main() {
        gl_FragColor.rgb = my_color;
        gl_FragColor.a = 1.0;
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

// gl.clearColor(0, 0, 0, 1);
// gl.clear(gl.COLOR_BUFFER_BIT);

const my_color = gl.getUniformLocation(program!, 'my_color');

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
        console.log('unable to create program');
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

function draw_polygon(points: Point[]) {
    console.log(points);
    const vertices_data : number[] = [];
    points.forEach((p: Point) => {
        vertices_data.push(p.x, p.y);
    });
    const vertices = new Float32Array(vertices_data);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const primitive_type = gl.LINE_LOOP;
    const offset = 0;
    const count = vertices.length / 2;

    gl.drawArrays(primitive_type, offset, count);
}



function get_gl_coords(x: number, y: number) {
    const rect = canvas.getBoundingClientRect();
    const width = canvas.width;
    const height = canvas.height;
    const _x = (x - rect.left) / width * 2 - 1;
    const _y = (y - rect.top) / height * -2 + 1;
    return [_x, _y];
}


class Point {
    x: number = 0;
    y: number = 0;

    constructor (x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    copy(): Point {
        return new Point(this.x, this.y);
    }
}

// p1 -> p2
class Edge {
    p1: Point;
    p2: Point;

    constructor (p1: Point, p2: Point) {
        this.p1 = p1;
        this.p2 = p2;
    }

    copy(): Edge {
        return new Edge(this.p1, this.p2);
    }
}

function area(edge: Edge, point: Point) : number {
    const p1 = edge.p1;
    const p2 = edge.p2;
    const p3 = point;
    return (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y); 
}

function intersect(edge1: Edge, edge2: Edge) : Point | null {
    const area1 = area(edge1, edge2.p1);
    const area2 = area(edge1, edge2.p2);

    if (area1 * area2 >= -eps) {
        return null;
    }

    const area3 = area(edge2, edge1.p1);
    const area4 = area(edge2, edge1.p2);

    if (area3 * area4 >= -eps) {
        return null;
    }

    // compute intersection point
    const t = area3 / (area3 - area4);

    const x = edge1.p1.x + (edge1.p2.x - edge1.p1.x) * t;
    const y = edge1.p1.y + (edge1.p2.y - edge1.p1.y) * t;

    return new Point(x, y);
} 

class Loop {
    points: Point[] = [];

    constructor (points: Point[]) {
        // clone points
        points.forEach((p: Point) => {
            this.points.push(new Point(p.x, p.y));
        });
    }
    
    getedges(): Edge[] {
        const edges: Edge[] = [];
        for (let i = 0; i < this.points.length; i++) {
            const p1 = this.points[i];
            const p2 = this.points[(i + 1) % this.points.length];
            edges.push(new Edge(p1, p2));
        }
        return edges;
    }
    
    copy(): Loop {
        return new Loop(this.points);
    }
}

class Polygon {
    loops: Loop[] = [];

    add_loop(loop: Loop) {
        this.loops.push(loop.copy());
    }
}

const main_polygon = new Polygon();
const clip_polygon = new Polygon();


const main_polygon_button = document.getElementById('main-polygon-button') as HTMLButtonElement;
const clip_polygon_button = document.getElementById('clip-polygon-button') as HTMLButtonElement;
const clip_button = document.getElementById('clip-button') as HTMLButtonElement;
const clear_button = document.getElementById('clear-button') as HTMLButtonElement;

const state_text = document.getElementById('state-text') as HTMLParagraphElement;

enum State {
    MainPolygon,
    ClipPolygon,
}

var current_state = State.MainPolygon;

// current loop points
const current_points: Point[] = [];


function bind_color(r: number, g: number, b: number) {
    gl.uniform3f(my_color, r, g, b);
}

function drawall() {
    // part1: draw all already input loops in polygons
    // part2: draw current points
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // part1
    bind_color(1, 0, 0); // red
    console.log('main_polygon', main_polygon)
    main_polygon.loops.forEach((loop: Loop) => {
        draw_polygon(loop.points);
    });
    bind_color(0, 0, 1); // blue
    console.log('clip_polygon', clip_polygon)
    clip_polygon.loops.forEach((loop: Loop) => {
        draw_polygon(loop.points);
    });

    // part2
    if(current_state === State.MainPolygon) {
        bind_color(1, 0, 0); // red
    } else {
        bind_color(0, 0, 1); // blue
    }
    console.log('current_points', current_points)
    current_points.forEach((p: Point) => {
        draw_circle(p.x, p.y);
    });    
}

main_polygon_button.addEventListener('click', (e) => {
    // change state to main polygon
    if(current_points.length > 0) {
        alert('请先绘制当前多边形');
        return;
    }
    current_state = State.MainPolygon;
    state_text.innerText = '输入主多边形';
});

clip_polygon_button.addEventListener('click', (e) => {
    // change state to clip polygon
    if(current_points.length > 0) {
        alert('请先绘制当前多边形');
        return;
    }
    current_state = State.ClipPolygon;
    state_text.innerText = '输入裁剪多边形';
});

clear_button.addEventListener('click', (e) => {
    console.log('clear')
    // clear all
    main_polygon.loops.length = 0;
    clip_polygon.loops.length = 0;
    current_points.length = 0;
    drawall();
});


clip_button.addEventListener('click', (e) => {

});

canvas.addEventListener('click', (e) => {
    // left click
    const [x, y] = get_gl_coords(e.clientX, e.clientY);
    console.log('left click');
    current_points.push(new Point(x, y));
    drawall();
});

canvas.addEventListener('contextmenu', (e) => {
    // right click
    console.log('right click')
    e.preventDefault();
    // end current loop
    if (current_points.length < 3) {
        alert('至少需要三个点');
        return;
    }
    const loop = new Loop(current_points);
    console.log(loop);
    if (current_state === State.MainPolygon) {
        main_polygon.add_loop(loop);
    } else {
        clip_polygon.add_loop(loop);
    }
    console.log(main_polygon);
    console.log(clip_polygon);
    // clear current points
    current_points.length = 0;
    drawall();
});
