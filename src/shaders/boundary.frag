precision highp float;

uniform sampler2D u_readTexture;

uniform float u_scale;

varying vec3 v_offset;

void main( ) {

    vec3 pos = get3DFragCoord( );

    gl_FragColor = vec4( u_scale * texture3D( u_readTexture, (pos + v_offset) ).xyz, 1.0 );
    //gl_FragColor = vec4( vOffset, 1.0 );
    //gl_FragColor = vec4( 0., 1.0, 0.5, 1.0);
}
