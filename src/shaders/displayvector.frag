precision highp float;

uniform sampler2D read;

uniform vec3 bias;
uniform vec3 scale;

varying vec2 vUv;

void main( ) {
    float threshold = 0.1;

    vec3 color = bias + scale * texture2D( read, vUv ).xyz;

    gl_FragColor = vec4( color, 1.0 );
    //gl_FragColor = vec4( texcoord.xyxy );
}