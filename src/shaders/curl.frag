precision mediump float;

uniform sampler2D u_readTexture;

uniform float u_halfrdx;

// Calculated discrete curl of given vector field.
void main( ) {
    vec3 pos = get3DFragCoord( );
    mat3 offset = mat3( 1.0 );

    // Get velocity values from neighbours.
    vec4 r = texture3D( u_readTexture, ( pos + offset[0] ) );
    vec4 l = texture3D( u_readTexture, ( pos - offset[0] ) );
    vec4 u = texture3D( u_readTexture, ( pos + offset[1] ) );
    vec4 d = texture3D( u_readTexture, ( pos - offset[1] ) );
    vec4 b = texture3D( u_readTexture, ( pos + offset[2] ) );
    vec4 f = texture3D( u_readTexture, ( pos - offset[2] ) );

    // Compute the curl
    vec3 curl = vec3(
        (u.z - d.z - b.y + f.y),
        (b.x - f.x - l.z + r.z),
        (l.y - r.y - u.x + d.x) 
    ) * u_halfrdx;

    gl_FragColor = vec4( curl, 1.0 );
}