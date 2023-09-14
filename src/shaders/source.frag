precision highp float;

uniform vec2 res; // grid resolution
uniform sampler2D read;
uniform vec2 position;
uniform vec3 color;

float gauss( vec2 p, float r ) {
    return exp( -dot( p, p ) / r );
}

void main( ) {
    float radius = 0.01;
    float force = 10.0;

    // position comes in normalized and upside down
    vec2 pos = vec2( position.x, position.y ) * res.xy;
    vec3 col = color.xyz * vec3(res.xyy) * force;

    vec2 uv = gl_FragCoord.xy / res.xy;
    vec3 base = texture2D( read, uv ).xyz;
    vec2 coord = pos.xy - gl_FragCoord.xy;
    vec3 splat = col * gauss( coord, res.x * radius );
    gl_FragColor = vec4( base + splat, 1.0 );
    //gl_FragColor = vec4(position.xy, 0.0, 1.0);
}
