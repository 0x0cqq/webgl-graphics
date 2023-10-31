import { vec3, mat4 } from "gl-matrix";
import { rad_to_deg, deg_to_rad } from "../utils/math_utils";

export enum CameraMovement {
    FORWARD,
    BACKWARD,
    LEFT,
    RIGHT,
    UP,
    DOWN,
};

const YAW = -90.0;
const PITCH = 0.0;
const SPEED = 2.5;
const SENSITIVITY = 0.1;
const ZOOM = 45.0;

export class Camera {
    position: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
    front_axis: vec3 = vec3.fromValues(0.0, 0.0, -1.0);
    up_axis: vec3 = vec3.fromValues(0.0, 1.0, 0.0);
    right_axis: vec3 = vec3.fromValues(1.0, 0.0, 0.0);
    world_up: vec3;

    yaw: number;
    pitch: number;

    movement_speed: number = SPEED;
    mouse_sensitivity: number = SENSITIVITY;
    zoom: number = ZOOM;

    update_camera_vectors() {
        let front = vec3.create();
        front[0] = Math.cos(deg_to_rad(this.yaw)) * Math.cos(deg_to_rad(this.pitch));
        front[1] = Math.sin(deg_to_rad(this.pitch));
        front[2] = Math.sin(deg_to_rad(this.yaw)) * Math.cos(deg_to_rad(this.pitch));
        vec3.normalize(this.front_axis, front);
        vec3.cross(this.right_axis, this.front_axis, this.world_up);
        vec3.normalize(this.right_axis, this.right_axis);
        vec3.cross(this.up_axis, this.right_axis, this.front_axis);
        vec3.normalize(this.up_axis, this.up_axis);
        // console.log('--------------------------------------')
        // console.log('front', this.front_axis[0].toFixed(2), this.front_axis[1].toFixed(2), this.front_axis[2].toFixed(2))
        // console.log('up', this.up_axis[0].toFixed(2), this.up_axis[1].toFixed(2), this.up_axis[2].toFixed(2))
        // console.log('right', this.right_axis[0].toFixed(2), this.right_axis[1].toFixed(2), this.right_axis[2].toFixed(2))
    }

    
    constructor(position: vec3 = vec3.fromValues(0.0, 0.0, 1.0), up: vec3 = vec3.fromValues(0.0, 1.0, 0.0), yaw: number = YAW, pitch: number = PITCH) {
        this.position = position;
        this.world_up = up;
        this.yaw = yaw;
        this.pitch = pitch;
        this.update_camera_vectors();
    }

    get_position_string(): string {
        return `(${this.position[0].toFixed(2)}, ${this.position[1].toFixed(2)}, ${this.position[2].toFixed(2)})`
    }

    get_angles_string(): string {
        return `(yaw: ${this.yaw.toFixed(2) }, pitch: ${this.pitch.toFixed(2)})`
    }
    
    get_zoom_string(): string {
        return `zoom: ${this.zoom.toFixed(2)}`
    }


    get_view_matrix(): mat4 {
        let view = mat4.create();
        let center = vec3.create();
        vec3.add(center, this.position, this.front_axis);
        mat4.lookAt(view, this.position, center, this.up_axis);
        return view;
    }

    get_projection_matrix(width: number, height: number): mat4 {
        const projectionMatrix = mat4.perspective(
            mat4.create(),
            deg_to_rad(this.zoom),
            width / height,
            1,
            2000.0
        );
        return projectionMatrix;
    }

    process_keyboard(direction: CameraMovement, delta_time: number) {
        let velocity = this.movement_speed * delta_time;
        if (direction == CameraMovement.FORWARD) {
            vec3.scaleAndAdd(this.position, this.position, this.front_axis, velocity);
        }
        if (direction == CameraMovement.BACKWARD) {
            vec3.scaleAndAdd(this.position, this.position, this.front_axis, -velocity);
        }
        if (direction == CameraMovement.LEFT) {
            vec3.scaleAndAdd(this.position, this.position, this.right_axis, -velocity);
        }
        if (direction == CameraMovement.RIGHT) {
            vec3.scaleAndAdd(this.position, this.position, this.right_axis, velocity);
        }
        if (direction == CameraMovement.UP) {
            vec3.scaleAndAdd(this.position, this.position, this.up_axis, velocity);
        }
        if (direction == CameraMovement.DOWN) {
            vec3.scaleAndAdd(this.position, this.position, this.up_axis, -velocity);
        }
    }

    process_mouse_movement(x_offset: number, y_offset: number, constrain_pitch: boolean = true) {
        x_offset *= this.mouse_sensitivity;
        y_offset *= this.mouse_sensitivity;
        
        this.yaw += x_offset;
        this.pitch += y_offset;

        if (constrain_pitch) {
            if (this.pitch > 89.0) {
                this.pitch = 89.0;
            }
            if (this.pitch < -89.0) {
                this.pitch = -89.0;
            }
        }

        this.update_camera_vectors();
    }

    process_mouse_scroll(y_offset: number) {
        console.log(y_offset);
        if (this.zoom >= 1.0 && this.zoom <= 90.0) {
            this.zoom -= y_offset;
        }
        if (this.zoom <= 1.0) {
            this.zoom = 1.0;
        }
        if (this.zoom >= 90.0) {
            this.zoom = 90.0;
        }
    }
    
};