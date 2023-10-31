#version 300 es

precision highp float;

in vec2 v_texcoord;

out vec4 FragColor;


uniform sampler2D u_screen;

void main()
{
    // guassian blur
    vec2 tex_offset = 1.0 / vec2(textureSize(u_screen, 0)); // gets size of single texel
    vec3 result = vec3(0.0);
    for(int x = -2; x <= 2; x++)
    {
        for(int y = -2; y <= 2; y++)
        {
            vec2 offset = vec2(x, y) * tex_offset;
            vec4 this_color = texture(u_screen, v_texcoord + offset);
            result += vec3(this_color.r, this_color.g, this_color.b);
        }
    }
    vec3 col = vec3(result / 25.0);
    FragColor = vec4(col, 1.0);
} 