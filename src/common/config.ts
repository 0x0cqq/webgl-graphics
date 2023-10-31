
interface ObjectData {
    type: string;
    position: number[];
    speed: number[];
    isMovable: boolean;
    color: number[];
}

interface BoundaryData {
    x: number[];
    y: number[];
    z: number[];
}

interface CameraData {
    position: number[];
    angle: number[]; // yaw + pitch
    zoom: number;
}


interface ConfigData {
    objects: ObjectData[];
    boundary: BoundaryData;
    camera: CameraData;
}


export class Config {
    readFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => {
                try {
                    let data = reader.result as string;
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            };
        });
    }
    async load(file: File) {
        const data_string = await this.readFile(file);
        
        const config_data = JSON.parse(data_string) as ConfigData;

    }
};