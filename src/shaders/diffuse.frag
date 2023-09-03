precision highp float;

uniform float dt; // detla time
uniform vec2 res; // renderer resolution
uniform sampler2D bufferTexture; // read texture

varying vec2 texcoord;

void main( ) {
    vec2 pixel = gl_FragCoord.xy / res.xy;
    float dxp = 1.0 / res.x; // size of a single x pixel
    float dyp = 1.0 / res.y; // size of a single y pixel

    vec4 center = texture2D( bufferTexture, pixel );
    vec4 right = texture2D( bufferTexture, vec2( pixel.x + dxp, pixel.y ) );
    vec4 left = texture2D( bufferTexture, vec2( pixel.x - dxp, pixel.y ) );
    vec4 up = texture2D( bufferTexture, vec2( pixel.x, pixel.y + dyp ) );
    vec4 down = texture2D( bufferTexture, vec2( pixel.x, pixel.y - dyp ) );

    float a = dt * 15.0 * res.x * res.y;

    center += a * ( right + left + up + down ) / ( 1.0 + 4.0 * a );
    
    //float minimum = 0.003;

    //if ( factor >= -minimum && factor < 0.0 )
      //  factor = -minimum;
    gl_FragColor = vec4(center.xyz, 1.0);

    //gl_FragColor = pixel.xyxy;
    gl_FragColor = vec4(texcoord.xyxy);
    //gl_FragColor = vec4(gl_FragCoord.xyxy / res.xyxy);
    //gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}