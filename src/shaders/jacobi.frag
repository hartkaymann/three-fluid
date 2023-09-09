precision highp float;

uniform vec2 res; // grid resolution
uniform sampler2D x;
uniform sampler2D b;

uniform float alpha;
uniform float rbeta;

void main( ) {
    vec2 uv = gl_FragCoord.xy / res.xy;
    float dxp = 1.0 / res.x; // size of a single x pixel
    float dyp = 1.0 / res.y; // size of a single y pixel

    vec2 center = texture2D( b, uv ).xy;
    vec2 right  = texture2D( x, uv + vec2( dxp, 0.0 ) ).xy;
    vec2 left   = texture2D( x, uv - vec2( dxp, 0.0 ) ).xy;
    vec2 up     = texture2D( x, uv + vec2( 0.0, dyp ) ).xy;
    vec2 down   = texture2D( x, uv - vec2( 0.0, dyp ) ).xy;

    gl_FragColor = vec4( ( left + right + up + down + alpha * center) * rbeta, 0.0, 1.0 );
}