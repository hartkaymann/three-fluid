precision highp float;

uniform sampler2D u_velocityTexture;

uniform float u_halfrdx;

void main( ) {
    vec3 pos = get3DFragCoord( );
    mat3 offset = mat3( 1.0 );

    // Get velocity values from neighbours.
    vec4 l = texture3D( u_velocityTexture, ( pos + offset[0] ) );
    vec4 r = texture3D( u_velocityTexture, ( pos - offset[0] ) );
    vec4 t = texture3D( u_velocityTexture, ( pos + offset[1] ) );
    vec4 b = texture3D( u_velocityTexture, ( pos - offset[1] ) );
    vec4 u = texture3D( u_velocityTexture, ( pos + offset[2] ) );
    vec4 d = texture3D( u_velocityTexture, ( pos - offset[2] ) );

    // Compute vorticity as curl
    vec3 vorticity = vec3(
        (t.z - b.z - u.y + d.y),
        (u.x - d.x - r.z + l.z),
        (r.y - l.y - t.x + b.x) 
    ) * u_halfrdx;

    gl_FragColor = vec4( vorticity, 1.0 );
}