precision highp float;

uniform vec2 res; // grid resolution

uniform float halfrdx;

uniform sampler2D velocity;

void main( ) {
    vec2 uv = gl_FragCoord.xy / res.xy;
    vec2 dxp = vec2( 1.0 / res.x, 0.0 );
    vec2 dyp = vec2( 0.0, 1.0 / res.y );

    float right = texture2D( velocity, uv + dxp ).y;
    float left  = texture2D( velocity, uv - dxp ).y;
    float up    = texture2D( velocity, uv + dyp ).x;
    float down  = texture2D( velocity, uv - dyp ).x;

    float curl = halfrdx * ( ( right - left ) - ( up - down ) );
    gl_FragColor = vec4( curl, 0.0, 0.0, 1.0 );
}