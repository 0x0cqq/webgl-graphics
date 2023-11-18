#version 300 es
precision highp float;

uniform sampler2D u_accumulate;
uniform sampler2D u_accumulate_alpha;

// 这个是用来从两个 accumlated 的纹理中，获得最终的颜色

out vec4 fragColor;

void main() {
    // 找到当前像素的坐标
    ivec2 frag_coord = ivec2(gl_FragCoord.xy);
    // 从像素的 Accum 纹理中获取当前像素的颜色值
    vec4 accum = texelFetch(u_accumulate, frag_coord, 0);
    float a = 1.0 - accum.a;
    // 从透明的 Accum 纹理中获取当前像素的透明度值
    accum.a = texelFetch(u_accumulate_alpha, frag_coord, 0).r;
    fragColor = vec4(a * accum.rgb / clamp(accum.a, 0.001, 50000.0), a);
}