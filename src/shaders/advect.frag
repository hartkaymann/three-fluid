precision highp float;

uniform float dt; // detla time
uniform vec2 res; // grid resolution

uniform sampler2D advected;
uniform sampler2D velocity;

vec2 bilerp(sampler2D d, vec2 p)
{
    vec4 ij; // i0, j0, i1, j1
    ij.xy = floor(p - 0.5) + 0.5;
    ij.zw = ij.xy + 1.0;

    vec4 uv = ij / res.xyxy;
    vec2 d11 = texture2D(d, uv.xy).xy;
    vec2 d21 = texture2D(d, uv.zy).xy;
    vec2 d12 = texture2D(d, uv.xw).xy;
    vec2 d22 = texture2D(d, uv.zw).xy;

    vec2 a = p - ij.xy;

    return mix(mix(d11, d21, a.x), mix(d12, d22, a.x), a.y);
}

void main( ) {
    vec2 uv = gl_FragCoord.xy / res.xy;

    vec2 pos = gl_FragCoord.xy - dt * texture2D(velocity, uv).xy; 
    gl_FragColor = vec4(bilerp(advected, pos), 0.0, 1.0);
}