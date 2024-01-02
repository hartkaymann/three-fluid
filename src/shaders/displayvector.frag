precision mediump float;

uniform sampler2D u_readTexture;

uniform vec3 u_bias;
uniform vec3 u_scale;

varying vec2 v_uv;

void main( ) {
    float threshold = 0.1;

    vec3 color = u_bias + u_scale * texture2D( u_readTexture, v_uv ).xyz;

    gl_FragColor = vec4( color, 1.0 );
    //gl_FragColor = vec4( texcoord.xyxy );
}