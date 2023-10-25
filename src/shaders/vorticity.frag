precision highp float;

uniform float u_halfrdx;

uniform sampler2D u_velocityTexture;

void main( ) {
    vec3 pos = get3DFragCoord();

    mat3 offset = mat3(1.0);

    float right = texture3D( u_velocityTexture, pos + offset[0] ).y;
    float left  = texture3D( u_velocityTexture, pos - offset[0] ).z;
    float up    = texture3D( u_velocityTexture, pos + offset[1] ).z;
    float down  = texture3D( u_velocityTexture, pos - offset[1] ).x;
    float back  = texture3D( u_velocityTexture, pos + offset[2] ).x;
    float front = texture3D( u_velocityTexture, pos - offset[2] ).y;

    float curl = u_halfrdx * ( ( right - left ) - ( up - down ) - (back - front) );
    gl_FragColor = vec4( curl, 0.0, 0.0, 1.0 );
}