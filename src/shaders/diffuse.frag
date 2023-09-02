precision highp float;

uniform vec2 res; // renderer resolution
uniform sampler2D bufferTexture;

varying vec2 texcoord;

void main( ) {
    vec2 pixel = gl_FragCoord.xy / res.xy;
    gl_FragColor = texture2D( bufferTexture, pixel );

    float dxp = 1.0 / res.x; // size of a single x pixel
    float dyp = 1.0 / res.y; // size of a single y pixel

    vec4 right = texture2D( bufferTexture, vec2( pixel.x + dxp, pixel.y ) );
    vec4 left = texture2D( bufferTexture, vec2( pixel.x - dxp, pixel.y ) );
    vec4 up = texture2D( bufferTexture, vec2( pixel.x, pixel.y + dyp ) );
    vec4 down = texture2D( bufferTexture, vec2( pixel.x, pixel.y - dyp ) );

    float factor = 15.0 * 0.016 * ( right.r + left.r + up.r + down.r - 4.0 * gl_FragColor.r );
    float minimum = 0.003;

    if ( factor >= -minimum && factor < 0.0 )
        factor = -minimum;
    gl_FragColor.rgb += factor;

    //gl_FragColor = vec4(texcoord.xyxy);
    //gl_FragColor = vec4(gl_FragCoord.xyxy / res.xyxy);
    //gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}