#version 300 es

precision highp float;

// the varied color passed from the vertex shader
in vec4 v_color;
in vec2 v_texcoord;

// texture for the fragment shader
uniform sampler2D u_diffuse;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = texture(u_diffuse, v_texcoord) * v_color;
}