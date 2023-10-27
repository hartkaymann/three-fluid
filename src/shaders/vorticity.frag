precision highp float;

uniform sampler2D u_velocityTexture;

uniform vec3 u_resolution;

uniform float u_halfrdx;

void main( ) {
    vec3 pos = get3DFragCoord( u_resolution );

    mat3 offset = mat3(1.0);

    float right = texture3D( u_velocityTexture, (pos + offset[0]) / u_resolution, u_resolution ).y;
    float left  = texture3D( u_velocityTexture, (pos - offset[0]) / u_resolution, u_resolution ).z;
    float up    = texture3D( u_velocityTexture, (pos + offset[1]) / u_resolution, u_resolution ).z;
    float down  = texture3D( u_velocityTexture, (pos - offset[1]) / u_resolution, u_resolution ).x;
    float back  = texture3D( u_velocityTexture, (pos + offset[2]) / u_resolution, u_resolution ).x;
    float front = texture3D( u_velocityTexture, (pos - offset[2]) / u_resolution, u_resolution ).y;

    float curl = u_halfrdx * ( ( right - left ) - ( up - down ) - (back - front) );
    gl_FragColor = vec4( curl, 0.0, 0.0, 1.0 );
}