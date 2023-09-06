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

    vec3 center = texture2D( b, uv ).xyz;
    vec3 right  = texture2D( x, vec2( uv.x + dxp, uv.y ) ).xyz;
    vec3 left   = texture2D( x, vec2( uv.x - dxp, uv.y ) ).xyz;
    vec3 up     = texture2D( x, vec2( uv.x, uv.y + dyp ) ).xyz;
    vec3 down   = texture2D( x, vec2( uv.x, uv.y - dyp ) ).xyz;

    gl_FragColor = vec4( ( left + right + up + down + alpha * center ) * rbeta, 1.0 );
}