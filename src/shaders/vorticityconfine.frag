precision highp float;

uniform sampler2D u_velocityTexture;
uniform sampler2D u_vorticityTexture;

uniform vec3 u_resolution;

uniform float u_deltaTime;
uniform float u_halfrdx;
uniform float u_curl;

const float epsilon = 2.4414e-4;

void main( ) {
    vec3 pos = get3DFragCoord( u_resolution );

    mat3 offset = mat3(1.0);

    // ω = ∇ × u
    vec3 mid   = texture3D( u_vorticityTexture, pos / u_resolution, u_resolution ).xyz;
    float right = texture3D( u_vorticityTexture, (pos + offset[0]) / u_resolution, u_resolution ).x;
    float up    = texture3D( u_vorticityTexture, (pos + offset[1]) / u_resolution, u_resolution ).y;
    float back  = texture3D( u_vorticityTexture, (pos + offset[2]) / u_resolution, u_resolution ).z;

    // η = ∇|ω|
    vec3 eta = vec3( 
        abs( right ) - abs( mid.x ), 
        abs( up ) - abs( mid.y), 
        abs( back ) - abs( mid.z) 
    );
    
    // N = η / |η|
    vec3 N = eta / length(eta);

    vec3 force = epsilon * cross(N, mid);

    vec3 base = texture3D( u_velocityTexture, pos / u_resolution, u_resolution ).xyz;
    gl_FragColor = vec4( base + ( u_deltaTime * force ), 1.0 );
    gl_FragColor = vec4(N, 1.0);
}