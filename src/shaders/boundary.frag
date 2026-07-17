precision mediump float;

uniform sampler2D u_readTexture;

uniform float u_scale;

// Copies the field; on walls writes u_scale * interior neighbour.
void main( ) {
    vec3 pos = get3DFragCoord( );

    if ( isBoundary( pos ) ) {
        gl_FragColor = vec4( u_scale * texture3D( u_readTexture, interiorNeighbor( pos ) ).xyz, 1.0 );
    } else {
        gl_FragColor = vec4( texture3D( u_readTexture, pos ).xyz, 1.0 );
    }
}
