precision highp float;

uniform vec2 res; // grid resolution
uniform sampler2D x;
uniform vec3 source;

void main( ) {
    vec2 pixel = gl_FragCoord.xy / res.xy;
    gl_FragColor = texture2D( x, pixel );

    float dist = distance( source.xy, gl_FragCoord.xy );
    gl_FragColor.rgb += source.z * max( 15.0 - dist, 0.0 );

    //gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
}
