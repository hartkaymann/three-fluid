precision highp float;

uniform vec2 res; // grid resolution
uniform sampler2D read;

uniform float dt;

void main( ) {
    vec2 uv = gl_FragCoord.xy / res.xy;

    float gravity = 9.81 * dt;

    vec3 base = texture2D( read, uv ).xyz;
    gl_FragColor = vec4( base + vec3( 0.0, -gravity, 0.0 ), 1.0 );
    gl_FragColor = vec4(base, 1.0);
}