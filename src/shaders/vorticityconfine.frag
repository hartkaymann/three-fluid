precision highp float;

uniform sampler2D u_velocityTexture;
uniform sampler2D u_vorticityTexture;

uniform float u_deltaTime;
uniform float u_halfrdx;
uniform float u_curl;


void main( ) {
    vec3 pos = get3DFragCoord();

    mat3 offset = mat3(1.0);

    float right = texture3D( u_vorticityTexture, pos + offset[0] ).x;
    float left  = texture3D( u_vorticityTexture, pos - offset[0] ).x;
    float up    = texture3D( u_vorticityTexture, pos + offset[1] ).x;
    float down  = texture3D( u_vorticityTexture, pos - offset[1] ).x;
    float back  = texture3D( u_vorticityTexture, pos + offset[2] ).x;
    float front = texture3D( u_vorticityTexture, pos - offset[2] ).x;
    float mid   = texture3D( u_vorticityTexture, pos ).x;

    vec3 force = u_halfrdx * vec3( 
        abs( up ) - abs( down ), 
        abs( right ) - abs( left ), 
        abs( back ) - abs( front) 
    );

    float epsilon = 2.4414e-4;
    float magSqr = max( epsilon, dot( force, force ) );

    force *= inversesqrt( magSqr ) * u_curl * mid; // use half live fast invsqrt?
    force.y *= -1.0;

    vec3 base = texture3D( u_velocityTexture, pos ).xyz;
    gl_FragColor = vec4( base + ( u_deltaTime * force ), 1.0 );
}