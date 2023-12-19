precision highp float;

uniform sampler2D u_advectedTexture;
uniform sampler2D u_velocityTexture;

uniform vec3 u_resolution;

uniform float u_deltaTime; 
uniform float u_dissipation;

uniform bool u_bfecc;

varying vec2 vUv;

// Trilinear interpolation
vec3 trilerp( sampler2D tex, vec3 p ) {
  vec3 fullCoords = p * u_resolution; 
  vec3 vi = floor( fullCoords - 0.5 ) + 0.5;
  vec3 vj = vi + 1.0 ;

  vec3 a = fract(fullCoords - 0.5);

  vec3 tex000 = texture3D( tex, vec3( vi.xyz ) / u_resolution, u_resolution ).xyz; // l b f
  vec3 tex100 = texture3D( tex, vec3( vj.x, vi.yz ) / u_resolution, u_resolution ).xyz;  // r b f
  vec3 tex010 = texture3D( tex, vec3( vi.x, vj.y, vi.z ) / u_resolution, u_resolution ).xyz; // l t f
  vec3 tex110 = texture3D( tex, vec3( vj.xy, vi.z ) / u_resolution, u_resolution ).xyz;  // r t f

  vec3 tex001 = texture3D( tex, vec3( vi.xy, vj.z ) / u_resolution, u_resolution ).xyz;  // l b b
  vec3 tex101 = texture3D( tex, vec3( vj.x, vi.y, vj.z ) / u_resolution, u_resolution ).xyz; // r b b
  vec3 tex011 = texture3D( tex, vec3( vi.x, vj.yz ) / u_resolution, u_resolution ).xyz;  // l t b
  vec3 tex111 = texture3D( tex, vec3( vj.xyz ) / u_resolution, u_resolution ).xyz; // r t b
  
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
  vec3 pos = get3DFragCoord( u_resolution );

  if(u_bfecc) {
    //BFECC
    vec3 pos_a = pos / u_resolution;
    vec3 pos_b = pos_a + texture3D(u_velocityTexture, pos_a, u_resolution).xyz; // forward step
    vec3 pos_c = pos_b - texture3D(u_velocityTexture, pos_b, u_resolution).xyz; // backward step
    vec3 error = 0.5 * (pos_c - pos_a) ; // calculate error

    vec3 pos_new = pos_a - texture3D(u_velocityTexture, pos_a + error, u_resolution).xyz; // new position
    gl_FragColor = vec4(u_dissipation * trilerp(u_advectedTexture, pos_new).xyz, 1.0);
  } else {
    vec3 pos_new = (pos / u_resolution) - texture3D( u_velocityTexture, pos / u_resolution, u_resolution ).xyz;
    gl_FragColor = vec4( u_dissipation * trilerp( u_advectedTexture, pos_new ), 1.0 );
  }

  //f(length(texture3D(u_advectedTexture, pos / u_resolution, u_resolution).xyz) < 0.000000001)
    // gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);

  //gl_FragColor = vec4(texture3D(u_advectedTexture, pos / u_resolution, u_resolution));
  //gl_FragColor = vec4(1.0, 0.0, 0.0,0.0);
}