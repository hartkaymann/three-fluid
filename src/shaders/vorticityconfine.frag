precision highp float;

uniform sampler2D u_velocityTexture;
uniform sampler2D u_vorticityTexture;

uniform float u_deltaTime;
uniform float u_halfrdx;
uniform float u_curl;

const float epsilon = 2.4414e-4;

void main( ) {
    vec3 pos = get3DFragCoord( );
    mat3 offset = mat3( 1.0 );

    vec4 l = abs( texture3D( u_vorticityTexture, ( pos + offset[0] ) ) );
    vec4 r = abs( texture3D( u_vorticityTexture, ( pos - offset[0] ) ) );
    vec4 t = abs( texture3D( u_vorticityTexture, ( pos + offset[1] ) ) );
    vec4 b = abs( texture3D( u_vorticityTexture, ( pos - offset[1] ) ) );
    vec4 u = abs( texture3D( u_vorticityTexture, ( pos + offset[2] ) ) );
    vec4 d = abs( texture3D( u_vorticityTexture, ( pos - offset[2] ) ) );
    vec4 c = abs( texture3D( u_vorticityTexture, pos ) );

    vec3 grad = vec3( r.x - l.x, t.y - b.y, u.z - d.z );
    
    vec3 N = normalize(grad);
    vec3 force = u_curl * cross(N, c.xyz);

    vec3 base = texture3D(u_velocityTexture, pos).xyz;
    gl_FragColor = vec4(base + force * u_deltaTime, 1.0) ; // * dt?
}