precision highp float;

uniform sampler2D u_velocityTexture;

uniform vec3 u_resolution;

uniform float u_halfrdx;

void main( ) {
    vec3 pos = get3DFragCoord( u_resolution );

    mat3 offset = mat3(1.0);

    vec3 vel = texture3D(u_velocityTexture, pos / u_resolution, u_resolution).xyz;

    vec3 ddx = texture3D( u_velocityTexture, (pos + offset[0]) / u_resolution, u_resolution ).xyz - vel;
    vec3 ddy = texture3D( u_velocityTexture, (pos + offset[1]) / u_resolution, u_resolution ).xyz - vel;
    vec3 ddz = texture3D( u_velocityTexture, (pos + offset[2]) / u_resolution, u_resolution ).xyz - vel;

    // Compute vorticity as curl
    vec3 vorticity = vec3(ddz.y - ddy.z, ddx.z - ddz.x, ddy.x - ddx.y); 

    gl_FragColor = vec4( vorticity, 1.0 );
}