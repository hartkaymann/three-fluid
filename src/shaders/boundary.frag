precision highp float;

uniform sampler2D read;

uniform vec2 res; // grid resolution
uniform vec2 offset;
uniform float scale;

void main( ) {
    vec2 uv = ( gl_FragCoord.xy + offset.xy ) / res.xy;
    gl_FragColor = vec4( scale * texture2D( read, uv ).xyz, 1.0 );
    //gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
    //gl_FragColor = vec4(uv.xyxy);
}
