precision highp float;

uniform sampler2D u_velocityTexture;

uniform vec3 u_resolution;

uniform float u_halfrdx;

void main( ) {
    vec3 pos = get3DFragCoord( u_resolution );

    mat3 offset = mat3( 1.0 );

    // vec3 vel = texture3D(u_velocityTexture, pos / u_resolution, u_resolution).xyz;
    // vec3 ddx = texture3D( u_velocityTexture, (pos + offset[0]) / u_resolution, u_resolution ).xyz - vel;
    // vec3 ddy = texture3D( u_velocityTexture, (pos + offset[1]) / u_resolution, u_resolution ).xyz - vel;
    // vec3 ddz = texture3D( u_velocityTexture, (pos + offset[2]) / u_resolution, u_resolution ).xyz - vel;

    vec4 l = texture3D( u_velocityTexture, ( pos + offset[0] ) / u_resolution, u_resolution );
    vec4 r = texture3D( u_velocityTexture, ( pos - offset[0] ) / u_resolution, u_resolution );
    vec4 t = texture3D( u_velocityTexture, ( pos + offset[1] ) / u_resolution, u_resolution );
    vec4 b = texture3D( u_velocityTexture, ( pos - offset[1] ) / u_resolution, u_resolution );
    vec4 u = texture3D( u_velocityTexture, ( pos + offset[2] ) / u_resolution, u_resolution );
    vec4 d = texture3D( u_velocityTexture, ( pos - offset[2] ) / u_resolution, u_resolution );

    // Compute vorticity as curl
    // vec3 vorticity = vec3(ddz.y - ddy.z, ddx.z - ddz.x, ddy.x - ddx.y); 

    // vec3 vorticity = vec3( 
    //     ( t.z - b.z ) - ( u.y - d.y ), 
    //     ( r.z - l.z ) - ( u.x - d.x ), 
    //     ( r.y - l.y ) - ( t.x - b.x ) 
    // );

    vec3 vorticity = vec3(
        (t.z - b.z - u.y + d.y),
        (u.x - d.x - r.z + l.z),
        (r.y - l.y - t.x + b.x) 
    ) * u_halfrdx;

    gl_FragColor = vec4( vorticity, 1.0 );
}