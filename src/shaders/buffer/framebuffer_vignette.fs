#version 300 es

precision highp float;

in vec2 v_texcoord;

out vec4 FragColor;


uniform sampler2D u_screen;

void main()
{
    vec3 col = texture(u_screen, v_texcoord).rgb;
    // create a vignette effect
    float dist = distance(v_texcoord, vec2(0.5, 0.5));
    col *= smoothstep(0.7, 0.2, dist);

    FragColor = vec4(col, 1.0);
} 