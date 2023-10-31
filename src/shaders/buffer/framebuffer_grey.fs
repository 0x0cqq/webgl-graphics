#version 300 es

precision highp float;

in vec2 v_texcoord;

out vec4 FragColor;


uniform sampler2D u_screen;

void main()
{
    // grey effect
    vec3 col = texture(u_screen, v_texcoord).rgb;
    float grey = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = vec3(grey, grey, grey);
    FragColor = vec4(col, 1.0);
} 