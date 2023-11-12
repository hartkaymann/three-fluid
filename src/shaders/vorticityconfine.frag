precision highp float;

uniform sampler2D u_velocityTexture;
uniform sampler2D u_vorticityTexture;

uniform vec3 u_resolution;

uniform float u_deltaTime;
uniform float u_halfrdx;
uniform float u_curl;

const float epsilon = 2.4414e-4;

// void main( ) {
//     vec3 pos = get3DFragCoord( u_resolution );

//     mat3 offset = mat3(1.0);

//     // ω = ∇ × u
//     vec3 mid   = texture3D( u_vorticityTexture, pos / u_resolution, u_resolution ).xyz;
//     float right = texture3D( u_vorticityTexture, (pos + offset[0]) / u_resolution, u_resolution ).x;
//     float up    = texture3D( u_vorticityTexture, (pos + offset[1]) / u_resolution, u_resolution ).y;
//     float back  = texture3D( u_vorticityTexture, (pos + offset[2]) / u_resolution, u_resolution ).z;

//     // η = ∇|ω|
//     vec3 eta = vec3( 
//         abs( right ) - abs( mid.x ), 
//         abs( up ) - abs( mid.y), 
//         abs( back ) - abs( mid.z) 
//     );

//     // N = η / |η|
//     vec3 N = eta / length(eta);

//     vec3 force = epsilon * cross(N, mid);

//     vec3 base = texture3D( u_velocityTexture, pos / u_resolution, u_resolution ).xyz;
//     gl_FragColor = vec4( base + ( u_deltaTime * force ), 1.0 );
//     gl_FragColor = vec4(N, 1.0);
// }

void main( ) {
    vec3 pos = get3DFragCoord( u_resolution );
    mat3 offset = mat3( 1.0 );

    vec4 l = abs( texture3D( u_vorticityTexture, ( pos + offset[0] ) / u_resolution, u_resolution ) );
    vec4 r = abs( texture3D( u_vorticityTexture, ( pos - offset[0] ) / u_resolution, u_resolution ) );
    vec4 t = abs( texture3D( u_vorticityTexture, ( pos + offset[1] ) / u_resolution, u_resolution ) );
    vec4 b = abs( texture3D( u_vorticityTexture, ( pos - offset[1] ) / u_resolution, u_resolution ) );
    vec4 u = abs( texture3D( u_vorticityTexture, ( pos + offset[2] ) / u_resolution, u_resolution ) );
    vec4 d = abs( texture3D( u_vorticityTexture, ( pos - offset[2] ) / u_resolution, u_resolution ) );
    vec4 c = abs( texture3D( u_vorticityTexture, pos / u_resolution, u_resolution ) );

    vec3 grad = vec3( r.x - l.x, t.y - b.y, u.z - d.z );
    
    vec3 v = vec3(0.0);
    vec3 force = vec3(0.0);

    if(dot(grad, grad) != 0.0) {
        v = normalize(grad);
        force = u_curl * cross(v, c.xyz);
    }

    vec3 base = texture3D(u_velocityTexture, pos / u_resolution, u_resolution).xyz;
    gl_FragColor = vec4(base + force * u_deltaTime, 1.0) ; // * dt?
}