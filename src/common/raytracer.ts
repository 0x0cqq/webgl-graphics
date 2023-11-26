import { vec3, vec2, vec4, glMatrix } from "gl-matrix";
import { Camera } from "./camera";
import { deg_to_rad } from "../utils/math_utils";
import * as THREE from 'three';
import { createImageDataFromMesh, createVerticesFromMesh } from "./objects/objfile";

function checkUV(uv: vec2): boolean {
    if(uv[0] >= 0 && uv[0] <= 1 && uv[1] >= 0 && uv[1] <= 1) {
        return true;
    } else {
        console.error("uv is not in [0, 1] x [0, 1]", uv);
        return false;
    }
}

function clamp(num: number) {
    return Math.max(0, Math.min(1, num));
}

function repeat(num: number) {
    return num - Math.floor(num);
}

// uv is in [0, 1] x [0, 1] 
function fetchPixelFromImageData(image: ImageData, uv: vec2): vec4 {
    // if(!checkUV(uv)) {
    //     return vec4.fromValues(255, 0, 0, 255);
    // }
    const u = repeat(uv[0]); 
    const v = repeat(uv[1]);
    const x = Math.floor(u * image.width);
    const y = Math.floor((v) * image.height);
    const index = (y * image.width + x) * 4;
    return vec4.fromValues(image.data[index], image.data[index + 1], image.data[index + 2], image.data[index + 3]);   
}

// uv is in [0, 1] x [0, 1]
// it's calculated by u = x / width, v = y / height
function getRayDirectionFromUV(uv: vec2, size: vec2, camera: Camera): vec3 {
    if(!checkUV(uv)) {
        return vec3.fromValues(0, 0, 0);
    }
    // fov, this should be in degree
    const fov_degree = camera.zoom;
    const fov = deg_to_rad(fov_degree);
    // get the right / up / front axis
    const right_axis = vec3.clone(camera.right_axis);
    const up_axis = vec3.clone(camera.up_axis);
    const front_axis = vec3.clone(camera.front_axis);
    // the bias of the ray in x direction and y direction
    // 这里 fov 默认是 y 方向的，x 方向的 fov 需要根据宽高比来计算
    const bias_x = (uv[0] - 0.5), fov_x = fov * size[0] / size[1]; 
    const bias_y = - (uv[1] - 0.5), fov_y = fov;
    const theta_x = Math.atan(bias_x / 2 * Math.tan(fov_x / 2));
    const theta_y = Math.atan(bias_y / 2 * Math.tan(fov_y / 2));

    // rotate the front axis to the ray direction by theta_x and theta_y
    const ray_direction = vec3.create();
    vec3.rotateY(ray_direction, front_axis, vec3.create(), theta_x);
    vec3.rotateX(ray_direction, ray_direction, vec3.create(), theta_y);
    return ray_direction;
}


// 一个光线方向，关于法线反射得到的光线
function getReflectedRayDirection(ray: vec3, normal: vec3): vec3 {
    // 归一化
    const ray_normed = vec3.normalize(vec3.create(), ray);
    const normal_normed = vec3.normalize(vec3.create(), normal);
    // ray 在 normal 上的投影
    const projection = vec3.scale(vec3.create(), normal_normed, vec3.dot(ray_normed, normal_normed));
    const delta = vec3.sub(vec3.create(), ray_normed, projection);
    // 这里要两倍
    const reflected = vec3.scaleAndAdd(vec3.create(), ray_normed, delta, 2);
    const reflected_normed = vec3.normalize(vec3.create(), reflected);
    return reflected_normed;
}


class Ray {
    origin: vec3; // the origin of the ray in world space
    direction: vec3; // the current direction of the ray in world space
    constructor(origin: vec3 = vec3.fromValues(0, 0, 0), direction: vec3 = vec3.fromValues(0, 0, 0)) {
        this.origin = origin;
        this.direction = direction;
    }
}


// 这是一个三角面片
class TriangleFace {
    v: vec3[]; // 三个顶点
    n: vec3[]; // 三个顶点的法线
    texcoord: vec2[]; // 三个顶点的纹理坐标
    mesh: Mesh; // 所属的网格
    constructor(mesh: Mesh, num: number) {
        this.mesh = mesh;
        this.v = [mesh.vertices[num * 3], mesh.vertices[num * 3 + 1], mesh.vertices[num * 3 + 2]];
        this.n = [mesh.normal[num * 3], mesh.normal[num * 3 + 1], mesh.normal[num * 3 + 2]];
        this.texcoord = [mesh.texcoord[num * 3], mesh.texcoord[num * 3 + 1], mesh.texcoord[num * 3 + 2]];
    }

    /**
     * 
     * @param ray 光线
     * @returns bool 是否相交，t 相交距离，b1 b2 （相对于v0的）重心坐标
     */
    is_intersected_with(ray: Ray): [boolean, vec3, number, number, number] { 
        // Moller-Trumbore algorithm
        // from: https://zhuanlan.zhihu.com/p/451582864

        const s = vec3.sub(vec3.create(), ray.origin, this.v[0]);
        const e1 = vec3.sub(vec3.create(), this.v[1], this.v[0]);
        const e2 = vec3.sub(vec3.create(), this.v[2], this.v[0]);
        const s1 = vec3.cross(vec3.create(), ray.direction, e2);
        const s2 = vec3.cross(vec3.create(), s, e1);

        const s1_dot_e1 = vec3.dot(s1, e1);
        const t = vec3.dot(s2, e2) / s1_dot_e1;
        const b1 = vec3.dot(s1, s) / s1_dot_e1;
        const b2 = vec3.dot(s2, ray.direction) / s1_dot_e1;
        const p = vec3.scaleAndAdd(vec3.create(), ray.origin, ray.direction, t);

        if (t > 0 && b1 > 0 && b2 > 0 && b1 + b2 < 1) {
            return [true, p, t, b1, b2]
        } else {
            return [false, vec3.fromValues(0, 0, 0), 0, 0, 0]
        }
    }

    clamp_to_edge(b1: number, b2: number): [number, number] {
        const b1_clamped = Math.max(0, Math.min(1, b1));
        const b2_clamped = Math.max(0, Math.min(1, b2));
        return [b1_clamped, b2_clamped];
    }

    // 
    vec2_interpolated(b1: number, b2: number, v1: vec2, v2: vec2, v3: vec2): vec2 {
        const result = vec2.create();
        vec2.scaleAndAdd(result, result, v1, b1);
        vec2.scaleAndAdd(result, result, v2, b2);
        vec2.scaleAndAdd(result, result, v3, 1 - b1 - b2);
        return result;
    }

    vec3_interpolated(b1: number, b2: number, v1: vec3, v2: vec3, v3: vec3): vec3 {
        const result = vec3.create();
        vec3.scaleAndAdd(result, result, v1, b1);
        vec3.scaleAndAdd(result, result, v2, b2);
        vec3.scaleAndAdd(result, result, v3, 1 - b1 - b2);
        return result;
    }

    vec4_interpolated(b1: number, b2: number, v1: vec4, v2: vec4, v3: vec4): vec4 {
        const result = vec4.create();
        vec4.scaleAndAdd(result, result, v1, b1);
        vec4.scaleAndAdd(result, result, v2, b2);
        vec4.scaleAndAdd(result, result, v3, 1 - b1 - b2);
        return result;
    }
     
    normal_interpolated(b1: number, b2: number): vec3 {
        return this.vec3_interpolated(b1, b2, this.n[0], this.n[1], this.n[2]);
    }

    texcoord_interpolated(b1: number, b2: number): vec2 {
        return this.vec2_interpolated(b1, b2, this.texcoord[0], this.texcoord[1], this.texcoord[2]);
    }

}

class Mesh {
    vertices: vec3[];
    normal: vec3[];
    texcoord: vec2[];
    min: vec3;
    max: vec3;
    diffuse_image: ImageData;
    specular_image: ImageData;
    bump_image: ImageData;

    constructor(vertices: vec3[], normal: vec3[], texcoord: vec2[], diffuse_image: ImageData, specular_image: ImageData, bump_image: ImageData) {
        this.vertices = vertices;
        this.normal = normal;
        this.texcoord = texcoord;
        this.diffuse_image = diffuse_image;
        this.specular_image = specular_image;
        this.bump_image = bump_image;

        // calculate the min and max
        this.min = vec3.fromValues(Infinity, Infinity, Infinity);
        this.max = vec3.fromValues(-Infinity, -Infinity, -Infinity);
        for(const vertex of vertices) {
            vec3.min(this.min, this.min, vertex);
            vec3.max(this.max, this.max, vertex);
        }
        
    }

    is_intersected_with_box(ray: Ray): boolean {
        // https://zhuanlan.zhihu.com/p/610258258
        // 首先判断是否在内部，内部一定相交
        if(ray.origin[0] >= this.min[0] && ray.origin[0] <= this.max[0] && ray.origin[1] >= this.min[1] && ray.origin[1] <= this.max[1] && ray.origin[2] >= this.min[2] && ray.origin[2] <= this.max[2]) {
            return true;
        }
        // 分别判断射线和各轴近面的相交情况 
        for(let axis = 0; axis < 3; axis++) {
            let t = 0.0;
            if(Math.abs(ray.direction[axis]) > 1e-7) {
                if(ray.direction[axis] > 0) {
                    t = (this.min[axis] - ray.origin[axis]) / ray.direction[axis];
                } else {
                    t = (this.max[axis] - ray.origin[axis]) / ray.direction[axis];
                }
            }
            // 判断是否相交
            if(t > 0) {
                // 判断是否在面内部
                let inside = true;
                for(let i = 0; i < 3; i++) {
                    if(i !== axis) { // 只考虑其他的轴
                        const p = ray.origin[i] + t * ray.direction[i];
                        if(p < this.min[i] || p > this.max[i]) {
                            inside = false;
                            break;
                        }
                    }
                }
                if(inside) {
                    return true;
                }
            }
        }
        return false;
    }
    fetch_face(num: number): TriangleFace {
        return new TriangleFace(this, num);
    }
}





export class Scene {
    camera: Camera;
    lightPosition: vec3;
    // the faces to be intersected
    objects: Mesh[];
    constructor(camera: Camera, lightPosition: vec3) {
        this.camera = camera;
        this.lightPosition = lightPosition;
        this.objects = [];
    }
    // add a mesh object to the scene
    async add_mesh(three_mesh: THREE.Mesh) {
        console.log('add mesh', three_mesh)
        // 1. get the vertices, normals, texcoords
        const v = createVerticesFromMesh(three_mesh);
        // 2. get the images
        const image = await createImageDataFromMesh(three_mesh);
        
        console.log('v', v, 'image', image)

        // 3. create the mesh
        const n_elements = v.position.length / 3;
        const vertices: vec3[] = []
        const normals: vec3[] = []
        const texcoords: vec2[] = []
        for(let i = 0; i < n_elements; i++) {
            vertices.push(vec3.fromValues(v.position[i * 3], v.position[i * 3 + 1], v.position[i * 3 + 2]));
            normals.push(vec3.fromValues(v.normal[i * 3], v.normal[i * 3 + 1], v.normal[i * 3 + 2]));
            texcoords.push(vec2.fromValues(v.texcoord[i * 2], v.texcoord[i * 2 + 1]));
        }
        const mesh = new Mesh(vertices, normals, texcoords, image.diffuse_texture, image.specular_texture, image.bump_texture);
        console.log(mesh)
        // 4. add faces to the scene
        this.objects.push(mesh);
    }
    
    // return null if no intersection
    // else return the nearest intersection face
    find_nearest_intersection(ray: Ray): (TriangleFace | null) {
        let nearest_face: TriangleFace | null = null;
        let n_t = Infinity;
        for (const mesh of this.objects) {
            // 先检测是否和包围盒相交
            if(!mesh.is_intersected_with_box(ray)) {
                continue;
            }
            // 遍历所有面片
            const n_faces = mesh.vertices.length / 3;
            for(let face = 0; face < n_faces; face++) {
                const this_face = mesh.fetch_face(face);
                const [is_intersected, p, t, b1, b2] = this_face.is_intersected_with(ray);
                if (is_intersected && t < n_t) {
                    n_t = t;
                    nearest_face = this_face;
                }
            }
        }
        return nearest_face;
    
    }
}

export class RayTracer {
    scene: Scene;
    // depth of the ray tracing(max reflect/refract times)
    depth: number;
    // sample times
    sample_times: number;
    // moving average coefficient constant
    constructor(scene: Scene, depth: number = 5, sample_times: number = 10) {
        this.scene = scene;
        this.depth = depth;
        this.sample_times = sample_times;
    }
    // return the color perceived by the ray
    trace(ray: Ray): vec3 {
        let total_color = vec3.fromValues(0, 0, 0);
        for(let i = 1; i <= this.depth; i++) {
            // the i times reflected/refracted ray
            const nearest_face = this.scene.find_nearest_intersection(ray);
            if (nearest_face === null) {
                return vec3.fromValues(255, 255, 255); // return black
            } else {
                // get the intersection point
                const [is_intersected, p, t, b1, b2] = nearest_face.is_intersected_with(ray);
                // if(!is_intersected) {
                //     console.log("error: not intersected")
                // }
                // // get the normal of the intersection point, use a barycentric interpolation
                let normal = nearest_face.normal_interpolated(b1, b2);
                // // get the color of the intersection point
                const this_texcoord = nearest_face.texcoord_interpolated(b1, b2);
                const diffuse_color = fetchPixelFromImageData(nearest_face.mesh.diffuse_image, this_texcoord);
                const specular_color = fetchPixelFromImageData(nearest_face.mesh.specular_image, this_texcoord);

                // const bump_color = fetchPixelFromImageData(nearest_face.mesh.bump_image, this_texcoord);
                // // // modify the normal by bump mapping (TODO)
                
                // // // get the light direction
                const light_direction = vec3.sub(vec3.create(), this.scene.lightPosition, p);
                vec3.normalize(light_direction, light_direction);
                
                // // get the reflect direction
                const reflect_direction = getReflectedRayDirection(ray.direction, normal);
                const light_reflect_direction = getReflectedRayDirection(light_direction, normal);
                // // calculate the color
                let this_place_color = vec4.create();
                const ambient_light = 0.3;
                const diffuse_light = Math.max(0, vec3.dot(normal, light_direction));
                const specular_light = Math.pow(Math.max(0, vec3.dot(light_reflect_direction, vec3.negate(vec3.create(), ray.direction))), 3);

                vec4.scaleAndAdd(this_place_color, this_place_color, diffuse_color, ambient_light);
                vec4.scaleAndAdd(this_place_color, this_place_color, diffuse_color, diffuse_light);
                vec4.scaleAndAdd(this_place_color, this_place_color, specular_color, specular_light);


                // // update the ray
                // ray.origin = p;
                // ray.direction = reflect_direction;
                
                // console.log("intersected")
                // if(this_place_color[3] <= 10) {
                //     return vec3.fromValues(255, 0, 0);
                // }
                return vec3.fromValues(this_place_color[0], this_place_color[1], this_place_color[2]);
            }
        }
        return total_color;
    }
    do_raytracing(width: number, height: number, callback: (percent: number) => void): ImageData {
        // too big, will refuse to run
        if (width * height > 1000000) {
            alert("too big width & height")
            return new ImageData(0, 0);
        }
        // create a two dimensional array to store the color temporarily in float32
        const color_buffer = new Float32Array(width * height * 4);
        // initialize the color buffer
        for (let i = 0; i < width * height * 4; i++) {
            color_buffer[i] = 0;
        }
        // do ray tracing
        let total_work = 0, target_work = width * height * this.sample_times;
        for(let k = 0; k < this.sample_times; k++) {
            for (let i = 0; i < width; i++) {
                for(let j = 0; j < height; j++) {
                    const origin = this.scene.camera.get_eye_position()
                    const direction = getRayDirectionFromUV([i / width, j / height], [width, height], this.scene.camera);
                    const ray = new Ray(origin, direction);
                    const pixel = this.trace(ray);
                    // use a moving average to get the color
                    const index = (j * width + i) * 4;
                    color_buffer[index] = pixel[0];
                    color_buffer[index + 1] = pixel[1];
                    color_buffer[index + 2] = pixel[2];
                    color_buffer[index + 3] = 255;
                    total_work += 1;
                    if(total_work % 100 === 0) {
                        console.log(total_work / target_work)
                        callback(total_work / target_work);
                    }
                }
            }
        }
        // convert the color buffer to ImageData
        const image = new ImageData(width, height);
        for (let i = 0; i < width * height * 4; i++) {
            // clamp to [0, 255]
            image.data[i] = Math.max(0, Math.min(255, Math.round(color_buffer[i])));
        }
        return image;
    }
}