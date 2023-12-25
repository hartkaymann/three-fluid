precision highp float;

uniform sampler2D u_velocityTexture;
uniform sampler2D u_markerTexture;

uniform float u_halfrdx;

void main( ) {
  vec3 pos = get3DFragCoord( );

  // if ( texture3D( u_markerTexture, pos ).x == 0.0 )
  //   discard; // we got ourselves an air cell

  mat3 offset = mat3( 1.0 );

  float right = texture3D( u_velocityTexture, ( pos + offset[0] ) ).x;
  float left  = texture3D( u_velocityTexture, ( pos - offset[0] ) ).x;
  float up    = texture3D( u_velocityTexture, ( pos + offset[1] ) ).y;
  float down  = texture3D( u_velocityTexture, ( pos - offset[1] ) ).y;
  float back  = texture3D( u_velocityTexture, ( pos + offset[2] ) ).z;
  float front = texture3D( u_velocityTexture, ( pos - offset[2] ) ).z;

  float divergence = u_halfrdx * ( ( right - left ) + ( up - down ) + ( back - front ) );
  gl_FragColor = vec4( divergence, 0.0, 0.0, 1.0 );
  //gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
}