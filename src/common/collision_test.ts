import { vec2, vec3 } from "gl-matrix";
import { BasicObject, isColliding } from "./objects/basic_object";


// this class is responsible for detecting collision between objects
// and also bound the objects in a big boxes to avoid being too far away
// the speed is modified to avoid collision
export class CollisionTest {
    
    objects: BasicObject[] = [];

    boundaries: vec2[] = [];

    output_function: (s: string) => void;

    constructor(boundaries: vec2[], output_function: (s: string) => void = console.log) {
        this.boundaries = boundaries;
        this.output_function = output_function;
    }

    addObject(object: BasicObject): void {
        this.objects.push(object);
    }

    detectCollision(): void {
        const len = this.objects.length;
        // collide between objects
        for(let i = 0; i < len; i++) {
            for(let j = i + 1; j < len; j++) {
                if(!this.objects[i].enableCollision || !this.objects[j].enableCollision) {
                    continue;
                }
                const result = isColliding(this.objects[i], this.objects[j]);
                if(result[0] && result[1] && result[2]) {
                    const current_time_string = new Date().toLocaleTimeString();
                    this.output_function(`${current_time_string}, object ${i} and ${j} is colliding.`);
                    // swap speed
                    const g = this.objects[i].speed;
                    this.objects[i].speed = this.objects[j].speed;
                    this.objects[j].speed = g;
                }
            }
        }    
        // collide with boundaries, which is easy
        for(let i = 0; i < len; i++) {
            const aabb = this.objects[i].getAABBBox();
            for(let j = 0; j < 3; j++) {
                const current_time_string = new Date().toLocaleTimeString();
                if(aabb[j][0] < this.boundaries[j][0]) {
                    this.output_function(`${current_time_string}, object ${i} is colliding with boundary dim ${j} min`);
                    this.objects[i].speed[j] = Math.abs(this.objects[i].speed[j]);
                } else if(aabb[j][1] > this.boundaries[j][1]) {
                    this.output_function(`${current_time_string}, object ${i} is colliding with boundary dim ${j} max`);
                    this.objects[i].speed[j] = -Math.abs(this.objects[i].speed[j]);
                }
            }
        }
    }

    updatePosition(deltaTime: number): void {
        for(const object of this.objects) {
            object.updatePosition(deltaTime);
        }
    }
}