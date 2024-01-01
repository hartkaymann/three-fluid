precision mediump float;

uniform sampler2D u_advectedTexture;
uniform sampler2D u_velocityTexture;
uniform sampler2D u_forwardTexture;
uniform sampler2D u_backwardTexture;

uniform float u_deltaTime;

void main( ) {
  vec3 pos = get3DFragCoord();

  // Get values of the initial and intermadiate textures
  vec3 advected = texture3D(u_advectedTexture, pos).xyz;
  vec3 velocity = texture3D(u_velocityTexture, pos).xyz;
  vec3 forward = texture3D(u_forwardTexture, pos).xyz;
  vec3 backward = texture3D(u_backwardTexture, pos).xyz;

  // Get values at the closest eight cell centers of position after one semi-lagrangian step
  vec3 pos_new = pos - velocity * u_resolution * u_deltaTime;
  vec3 vi = floor( pos_new - 0.5 ) + 0.5;
  vec3 vj = vi + 1.0 ;

  vec3 tex000 = texture3D( u_advectedTexture, vec3( vi.xyz ) ).xyz; // l b f
  vec3 tex100 = texture3D( u_advectedTexture, vec3( vj.x, vi.yz ) ).xyz;  // r b f
  vec3 tex010 = texture3D( u_advectedTexture, vec3( vi.x, vj.y, vi.z ) ).xyz; // l t f
  vec3 tex110 = texture3D( u_advectedTexture, vec3( vj.xy, vi.z ) ).xyz;  // r t f

  vec3 tex001 = texture3D( u_advectedTexture, vec3( vi.xy, vj.z ) ).xyz;  // l b b
  vec3 tex101 = texture3D( u_advectedTexture, vec3( vj.x, vi.y, vj.z ) ).xyz; // r b b
  vec3 tex011 = texture3D( u_advectedTexture, vec3( vi.x, vj.yz ) ).xyz;  // l t b
  vec3 tex111 = texture3D( u_advectedTexture, vec3( vj.xyz ) ).xyz; // r t b

  // Find smallest adjacent value
  vec3 value_min = min(min(min(min(min(min(min(
    tex000, tex100), tex010), tex110), 
    tex001), tex101), tex011), tex111);

  // Find biggest adjacent value
  vec3 value_max = max(max(max(max(max(max(max(
    tex000, tex100), tex010), tex110), 
    tex001), tex101), tex011), tex111);

  // Calculate new value
  vec3 value_new = forward + 0.5 * ( advected - backward );

  // Limit new value into range of surroundings
  value_new = max( min( value_new, value_max ), value_min );

  gl_FragColor = vec4( value_new, 1.0 );
}