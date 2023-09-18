precision highp float;

uniform vec2 res; // grid resolution
uniform sampler2D velocity;
uniform sampler2D density;

uniform float dt;

void main( ) {
    vec2 uv = gl_FragCoord.xy / res.xy;

    float gravity = 0.981 * dt;

    vec3 base = texture2D( velocity, uv ).xyz;
    vec3 density = texture2D(density, uv).xyz;
    float factor = density.x > 0.0 ? 1.0 : 0.0;

    gl_FragColor = vec4( base - factor * vec3( 0.0, gravity, 0.0 ), 1.0 );
    // gl_FragColor = vec4(base, 1.0);
}