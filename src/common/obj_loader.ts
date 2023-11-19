import { load } from '@loaders.gl/core';
import { Mesh } from '@loaders.gl/schema';

import { OBJLoader, MTLLoader } from '@loaders.gl/obj';

import * as twgl from 'twgl.js';


export async function load_obj_to_twgl(objfile: string, mtlfile: string): Promise<{ [key: string]: twgl.primitives.TypedArray; }> {
    const data = await load(objfile, OBJLoader);

    const mtldata = await load(mtlfile, MTLLoader);

    // vertices
    console.log(data)
    console.log(mtldata)
    const position = data.attributes.POSITION.value;
    const position_array = twgl.primitives.createAugmentedTypedArray(3, position.length / 3);
    for(let i = 0; i < position.length; i += 3) {
        position_array.push(position[i], position[i+1], position[i+2]);
    }
    const normal = data.attributes.NORMAL.value;
    const normal_array = twgl.primitives.createAugmentedTypedArray(3, normal.length / 3);
    for(let i = 0; i < normal.length; i += 3) {
        normal_array.push(normal[i], normal[i+1], normal[i+2]);
    }
    const texcoord = data.attributes.TEXCOORD_0.value;
    const texcoord_array = twgl.primitives.createAugmentedTypedArray(2, texcoord.length / 2);
    for(let i = 0; i < texcoord.length; i += 2) {
        texcoord_array.push(texcoord[i], texcoord[i+1]);
    }

    return {
        position: position_array,
        normal: normal_array,
        texcoord: texcoord_array,
    }
}
