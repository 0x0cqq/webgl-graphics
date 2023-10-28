import { vec3, mat4 } from "gl-matrix";

enum CameraMovement {
    FORWARD,
    BACKWARD,
    LEFT,
    RIGHT
};

const YAW = -90.0;
const PITCH = 0.0;
const SPEED = 2.5;
const SENSITIVITY = 0.1;
const ZOOM = 45.0;

export class Camera {
    position: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
    front_axis: vec3 = vec3.fromValues(0.0, 1.0, 0.0);
    up_axis: vec3 = vec3.fromValues(0.0, 0.0, 1.0);
    right_axis: vec3 = vec3.fromValues(1.0, 0.0, 0.0);
    world_up: vec3 = vec3.fromValues(0.0, 1.0, 0.0);

    yaw: number;
    pitch: number;

    movement_speed: number = SPEED;
    mouse_sensitivity: number = SENSITIVITY;
    zoom: number = ZOOM;

    update_camera_vectors() {
        let front = vec3.create();
        front[0] = Math.cos(this.yaw * Math.PI / 180.0) * Math.cos(this.pitch * Math.PI / 180.0);
        front[1] = Math.sin(this.pitch * Math.PI / 180.0);
        front[2] = Math.sin(this.yaw * Math.PI / 180.0) * Math.cos(this.pitch * Math.PI / 180.0);
        vec3.normalize(this.front_axis, front);
        vec3.cross(this.right_axis, this.front_axis, this.world_up);
        vec3.normalize(this.right_axis, this.right_axis);
        vec3.cross(this.up_axis, this.right_axis, this.front_axis);
        vec3.normalize(this.up_axis, this.up_axis);
    }
    
    constructor(position: vec3 = vec3.fromValues(0.0, 0.0, 0.0), up_axis: vec3 = vec3.fromValues(0.0, 1.0, 0.0), yaw: number = YAW, pitch: number = PITCH) {
        this.position = position;
        this.world_up = up_axis;
        this.yaw = yaw;
        this.pitch = pitch;
        this.front_axis = vec3.fromValues(0.0, 0.0, -1.0);
        this.update_camera_vectors();
    }

    get_view_matrix(): mat4 {
        let view = mat4.create();
        let center = vec3.create();
        vec3.add(center, this.position, this.front_axis);
        mat4.lookAt(view, this.position, center, this.up_axis);
        return view;
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
        if (this.zoom >= 1.0 && this.zoom <= 45.0) {
            this.zoom -= y_offset;
        }
        if (this.zoom <= 1.0) {
            this.zoom = 1.0;
        }
        if (this.zoom >= 45.0) {
            this.zoom = 45.0;
        }
    }
    
};