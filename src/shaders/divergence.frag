precision highp float;

uniform vec2 res; // grid resolution

uniform mediump float halfrdx; // 0.5 / gridscale
uniform sampler2D velocity;

void main( ) {
    vec2 uv = gl_FragCoord.xy / res.xy;
    float dxp = 1.0 / res.x; // size of a single x pixel
    float dyp = 1.0 / res.y; // size of a single y pixel

    float right = texture2D( velocity, uv + vec2( dxp, 0.0 ) ).x;
    float left  = texture2D( velocity, uv - vec2( dxp, 0.0 ) ).x;
    float up    = texture2D( velocity, uv + vec2( 0.0, dyp ) ).y;
    float down  = texture2D( velocity, uv - vec2( 0.0, dyp ) ).y;

    float divergence = halfrdx * ( ( right - left ) + ( up - down ) );
    gl_FragColor = vec4( divergence, 0.0, 0.0, 1.0 );
}