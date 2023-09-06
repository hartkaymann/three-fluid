precision highp float;

uniform vec2 res; // grid resolution

uniform mediump float halfrdx; // 0.5 / gridscale
uniform sampler2D velocity;

void main( ) {
    vec2 uv = gl_FragCoord.xy / res.xy;
    float dxp = 1.0 / res.x; // size of a single x pixel
    float dyp = 1.0 / res.y; // size of a single y pixel

    vec4 left   = texture2D( velocity, uv + vec2( dxp, 0.0 ) );
    vec4 right  = texture2D( velocity, uv - vec2( dxp, 0.0 ) );
    vec4 up     = texture2D( velocity, uv + vec2( 0.0, dyp ) );
    vec4 down   = texture2D( velocity, uv - vec2( 0.0, dyp ) );

    gl_FragColor = vec4( halfrdx * ( ( right.x - left.x ) + ( up.y - down.y ) ));
}