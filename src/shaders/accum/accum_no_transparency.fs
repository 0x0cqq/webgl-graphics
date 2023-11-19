#version 300 es
precision highp float;

// 这个 shader 考虑了光照 + 透明，

layout(std140, column_major) uniform;

// these three are added by the accumulator class
uniform mat4 u_view_proj;
uniform vec3 u_eye_position;
uniform vec3 u_light_position;

// this should be added by the user in the inner render function
uniform sampler2D u_texture;

in vec3 v_position;
in vec2 v_texcoord;
in vec3 v_normal;
flat in vec4 v_color;

layout(location=0) out vec4 accumColor;
layout(location=1) out float accumAlpha;

float weight(float z, float a) {
    return clamp(pow(min(1.0, a * 10.0) + 0.01, 3.0) * 1e8 * pow(1.0 - z * 0.9, 3.0), 1e-2, 3e3);
}

void main() {
    vec3 position = v_position.xyz;
    vec3 normal = normalize(v_normal.xyz);
    vec2 texcoord = v_texcoord;

    vec4 base_color = v_color * texture(u_texture, texcoord);
    vec3 eye_direction = normalize(u_eye_position - position);
    vec3 light_vec = u_light_position - position;
    vec3 light_direction = normalize(light_vec);
    vec3 reflect_direction = reflect(-light_direction, normal);
    float nDotL = max(dot(light_direction, normal), 0.0);
    float diffuse = nDotL;
    float ambient = 0.2;
    float specular = pow(max(dot(reflect_direction, eye_direction), 0.0), 20.0);

    vec4 color = vec4((ambient + diffuse + specular) * base_color.rgb, v_color.a);
    color.rgb *= color.a;
    float w = weight(gl_FragCoord.z, color.a);
    accumColor = vec4(color.rgb * w, color.a);
    accumAlpha = color.a * w;
}