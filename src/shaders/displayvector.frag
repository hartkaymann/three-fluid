precision highp float;

uniform sampler2D read;

uniform vec3 bias;
uniform vec3 scale;

varying vec2 v_uv;

void main( ) {
    float threshold = 0.1;

    vec3 color = bias + scale * texture2D( read, v_uv ).xyz;

    gl_FragColor = vec4( color, 1.0 );
    //gl_FragColor = vec4( texcoord.xyxy );
}