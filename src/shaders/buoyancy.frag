precision highp float;

uniform vec2 res; // grid resolution
uniform sampler2D velocity;
uniform sampler2D density;

uniform float dt;

void main( ) {
    vec2 uv = gl_FragCoord.xy / res.xy;

    vec3 g = vec3(0.0, -0.981, 0.0) * dt;

    vec3 base = texture2D( velocity, uv ).xyz;
    vec3 density = texture2D(density, uv).xyz;

    gl_FragColor = vec4( base + (density.x * g), 1.0 );
    // gl_FragColor = vec4(base, 1.0);
}