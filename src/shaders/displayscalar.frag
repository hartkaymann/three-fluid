precision highp float;

uniform sampler2D read;

uniform vec3 bias;
uniform vec3 scale;

varying vec2 vUv;

void main( ) {
    gl_FragColor = vec4( bias + scale * texture2D( read, vUv ).xxx, 1.0 );
    //gl_FragColor = vec4( 1.0, 0.0, 1.0, 1.0 );
}