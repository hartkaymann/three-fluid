precision highp float;

uniform vec2 res; // grid resolution
uniform sampler2D read;
uniform vec2 position;
uniform vec3 color;

float gauss( vec2 p, float r ) {
    return exp( -dot( p, p ) / r );
}

void main( ) {
    float radius = 0.1;
    float force = 10.0;

    // position comes in normalized and upside down
    vec2 pos = vec2( position.x, 1.0 - position.y ) * res.xy;
    vec2 col = color.xy * res * force;

    vec2 uv = gl_FragCoord.xy / res.xy;
    vec2 base = texture2D( read, uv ).xy;
    vec2 coord = pos.xy - gl_FragCoord.xy;
    vec2 splat = col * gauss( coord, res.x * radius );
    gl_FragColor = vec4( base + splat, 0.0, 1.0 );
    //gl_FragColor = vec4(position.xy, 0.0, 1.0);
    //gl_FragColor = vec4(uv.xyxy);
}
