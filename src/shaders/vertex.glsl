// This is the vertex shader code for the WebGL application
// It defines the position and texture coordinates of the vertices

attribute vec3 a_position;
attribute vec2 a_texCoord;

uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;

varying vec2 v_texCoord;

void main() {
  gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);
  v_texCoord = a_texCoord;
}