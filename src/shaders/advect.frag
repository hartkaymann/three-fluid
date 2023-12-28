precision highp float;

uniform sampler2D u_advectedTexture;
uniform sampler2D u_velocityTexture;

uniform float u_deltaTime; 
uniform float u_dissipation;

varying vec2 vUv;

// Trilinear interpolation
vec3 trilerp( sampler2D tex, vec3 p ) {
  vec3 vi = floor( p - 0.5 ) + 0.5;
  vec3 vj = vi + 1.0 ;

  vec3 a = fract(p - 0.5);

  vec3 tex000 = texture3D( tex, vec3( vi.xyz ) ).xyz; // l b f
  vec3 tex100 = texture3D( tex, vec3( vj.x, vi.yz ) ).xyz;  // r b f
  vec3 tex010 = texture3D( tex, vec3( vi.x, vj.y, vi.z ) ).xyz; // l t f
  vec3 tex110 = texture3D( tex, vec3( vj.xy, vi.z ) ).xyz;  // r t f

  vec3 tex001 = texture3D( tex, vec3( vi.xy, vj.z ) ).xyz;  // l b b
  vec3 tex101 = texture3D( tex, vec3( vj.x, vi.y, vj.z ) ).xyz; // r b b
  vec3 tex011 = texture3D( tex, vec3( vi.x, vj.yz ) ).xyz;  // l t b
  vec3 tex111 = texture3D( tex, vec3( vj.xyz ) ).xyz; // r t b
  
  return mix(
  mix( 
    mix( tex000, tex100, a.x ),
    mix( tex010, tex110, a.x ),
    a.y 
    ),
  mix( 
    mix( tex001, tex101, a.x ), 
    mix( tex011, tex111, a.x ),
    a.y 
    ),
    a.z
  );

}

// Advection with BFECC(int the future) to reduce unwanted dissipation
void main( ) {
  vec3 pos = get3DFragCoord();

  vec3 velocity = texture3D( u_velocityTexture, pos ).xyz;

  vec3 pos_prev = pos - velocity * u_resolution * u_deltaTime;

  gl_FragColor = vec4( u_dissipation * trilerp( u_advectedTexture, pos_prev ), 1.0 );
}