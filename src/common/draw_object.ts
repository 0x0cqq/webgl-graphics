import { Camera } from "./camera";
import * as twgl from "twgl.js";

export interface DrawObject {  
    programInfo: twgl.ProgramInfo;
    render(camera: Camera, canvas: HTMLCanvasElement): void;
}