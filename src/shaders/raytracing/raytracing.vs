#version 300 es

in vec3 a_position;
in vec2 a_texcoord;

out vec3 v_frag_pos;
out vec2 v_texcoord;

void main() {
  v_frag_pos = a_position;
  v_texcoord = a_texcoord;
  gl_Position = vec4(a_position, 1.0);
}