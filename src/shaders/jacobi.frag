precision highp float;

uniform sampler2D u_pressureTexture; // x
uniform sampler2D u_divergenceTexture; // b
uniform sampler2D u_markerTexture;

uniform float u_alpha;
uniform float u_rbeta;

void main( ) {
  vec3 pos = get3DFragCoord( );
  mat3 offset = mat3( 1.0 );
  
  // if(texture3D( u_markerTexture, pos ).x == 0.0)
  //    discard; // we got ourselves an air cell


  // Get the divergence at the current cell
  vec3 center = texture3D( u_divergenceTexture, pos).xyz;
  
  // Get pressure values from neighbors.
  vec3 right  = texture3D( u_pressureTexture, (pos + offset[0]) ).xyz;
  vec3 left   = texture3D( u_pressureTexture, (pos - offset[0]) ).xyz;
  vec3 up     = texture3D( u_pressureTexture, (pos + offset[1]) ).xyz;
  vec3 down   = texture3D( u_pressureTexture, (pos - offset[1]) ).xyz;
  vec3 back   = texture3D( u_pressureTexture, (pos + offset[2]) ).xyz;
  vec3 front  = texture3D( u_pressureTexture, (pos - offset[2]) ).xyz;

  // Compute the new pressure value.
  gl_FragColor = vec4( ( left + right + up + down + back + front + u_alpha * center) * u_rbeta, 1.0 );
}