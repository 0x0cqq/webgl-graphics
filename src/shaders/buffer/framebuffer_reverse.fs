#version 300 es

precision highp float;

in vec2 v_texcoord;

out vec4 FragColor;


uniform sampler2D u_screen;

void main()
{
    // reverse effect
    vec3 col = texture(u_screen, v_texcoord).rgb;
    col = 1.0 - col;
    FragColor = vec4(col, 1.0);
} 