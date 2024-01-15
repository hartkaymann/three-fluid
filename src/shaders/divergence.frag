precision mediump float;

uniform sampler2D u_readTexture;

uniform float u_halfrdx;

// Calculated discrete divergence of given vector field.
void main( ) {
  vec3 pos = get3DFragCoord( );
  mat3 offset = mat3( 1.0 );

  float right = texture3D( u_readTexture, ( pos + offset[0] ) ).x;
  float left  = texture3D( u_readTexture, ( pos - offset[0] ) ).x;
  float up    = texture3D( u_readTexture, ( pos + offset[1] ) ).y;
  float down  = texture3D( u_readTexture, ( pos - offset[1] ) ).y;
  float back  = texture3D( u_readTexture, ( pos + offset[2] ) ).z;
  float front = texture3D( u_readTexture, ( pos - offset[2] ) ).z;

  float divergence = u_halfrdx * ( ( right - left ) + ( up - down ) + ( back - front ) );
  gl_FragColor = vec4( divergence, 0.0, 0.0, 1.0 );
}