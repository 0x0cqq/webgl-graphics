#version 300 es

precision highp float;

// the varied color passed from the vertex shader
in vec4 v_color;

uniform vec4 u_colorMult;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = v_color * u_colorMult;
}