precision highp float;

uniform vec2 res; // grid resolution
uniform sampler2D read;
uniform float dt;
uniform vec2 position;
uniform vec3 color;
uniform float amount;
uniform float radius;

float gauss( vec2 p, float r ) {
    return exp( -dot( p, p ) / r );
}

void main( ) {

    vec2 uv = gl_FragCoord.xy / res.xy;
    vec3 base = texture2D( read, uv ).xyz;
    vec2 coord = position.xy - uv;
    vec3 splat = dt * color.xyz * amount * gauss( coord, radius );
    gl_FragColor = vec4( base + splat, 1.0 );
    //gl_FragColor = vec4(position.xy, 0.0, 1.0);
}
