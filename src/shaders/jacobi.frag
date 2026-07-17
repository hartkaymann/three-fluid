precision mediump float;

uniform sampler2D u_pressureTexture; // x
uniform sampler2D u_divergenceTexture; // b

uniform float u_alpha;
uniform float u_rbeta;
uniform float u_boundaryScale;

// One step of iterative Jacobi solver.
void main( ) {
  vec3 pos = get3DFragCoord( );

  // Wall condition: pressure (scale > 0) uses p = 0 to damp checkerboard; viscosity reflects (no-slip)
  if ( isBoundary( pos ) ) {
    vec3 wall = u_boundaryScale > 0.0
      ? vec3( 0.0 )
      : u_boundaryScale * texture3D( u_pressureTexture, interiorNeighbor( pos ) ).xyz;
    gl_FragColor = vec4( wall, 1.0 );
    return;
  }

  mat3 offset = mat3( 1.0 );

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