precision highp float;

uniform sampler2D read;

uniform vec3 bias;
uniform vec3 scale;

varying vec2 texcoord;

void main( ) {
    gl_FragColor = vec4( bias + scale * texture2D( read, texcoord ).xyz, 1.0 );
    //gl_FragColor = vec4( 1.0, 0.0, 1.0, 1.0 );
}