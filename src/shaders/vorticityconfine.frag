precision mediump float;

uniform sampler2D u_velocityTexture;
uniform sampler2D u_vorticityTexture;

uniform float u_deltaTime;
uniform float u_halfrdx;
uniform float u_curl;

void main( ) {
    vec3 pos = get3DFragCoord( );
    mat3 offset = mat3( 1.0 );

    // Get vorticity values of neighbours
    vec4 l = abs( texture3D( u_vorticityTexture, ( pos + offset[0] ) ) );
    vec4 r = abs( texture3D( u_vorticityTexture, ( pos - offset[0] ) ) );
    vec4 t = abs( texture3D( u_vorticityTexture, ( pos + offset[1] ) ) );
    vec4 b = abs( texture3D( u_vorticityTexture, ( pos - offset[1] ) ) );
    vec4 u = abs( texture3D( u_vorticityTexture, ( pos + offset[2] ) ) );
    vec4 d = abs( texture3D( u_vorticityTexture, ( pos - offset[2] ) ) );
    vec4 c = abs( texture3D( u_vorticityTexture, pos ) );

    // Get local vorticity gradient 
    vec3 grad = vec3( r.x - l.x, t.y - b.y, u.z - d.z );

    if(length(grad) == 0.0)
        discard;
    
    // Normalize vorticity gradient
    vec3 N = normalize( grad );
    
    // Caluclate vorticity force
    vec3 force = u_curl * cross( N, c.xyz );

    vec3 base = texture3D( u_velocityTexture, pos ).xyz;
    gl_FragColor = vec4( base + force, 1.0 );
}