#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec2 a_texcoord;
in vec4 a_color;

// A matrix to transform the positions by
uniform mat4 u_matrix;

// The world matrix to rotate 
uniform mat4 u_world_matrix;

// a varying the color to the fragment shader
out vec4 v_color;
out vec2 v_texcoord;

// all shaders have a main function
void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * u_world_matrix * a_position;

  // Pass the color to the fragment shader.
  v_color = a_color;
  v_texcoord = a_texcoord;
}