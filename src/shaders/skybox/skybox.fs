#version 300 es
precision highp float;

// texture for the skybox
uniform samplerCube u_skybox;

uniform mat4 u_viewDirectionProjectionInverse;

// input position
in vec4 v_position;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  vec4 t = u_viewDirectionProjectionInverse * v_position;
  outColor = texture(u_skybox, normalize(t.xyz / t.w));
}