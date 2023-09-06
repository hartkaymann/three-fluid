precision highp float;

uniform vec2 res; // grid resolution
uniform sampler2D density; // read texture

uniform float alpha;
uniform float beta;

void main( ) {
    vec2 uv = gl_FragCoord.xy / res.xy;
    float dxp = 1.0 / res.x; // size of a single x pixel
    float dyp = 1.0 / res.y; // size of a single y pixel

    vec3 center = texture2D( density, uv ).xyz;
    vec3 right  = texture2D( density, vec2( uv.x + dxp, uv.y ) ).xyz;
    vec3 left   = texture2D( density, vec2( uv.x - dxp, uv.y ) ).xyz;
    vec3 up     = texture2D( density, vec2( uv.x, uv.y + dyp ) ).xyz;
    vec3 down   = texture2D( density, vec2( uv.x, uv.y - dyp ) ).xyz;

    gl_FragColor = vec4((left + right + up + down + alpha * center) / beta, 1.0);
}