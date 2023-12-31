precision mediump float;
precision mediump sampler2D;

uniform sampler2D u_readTexture;

uniform vec3 u_size;
uniform vec3 u_position;
uniform vec3 u_color;

uniform float u_amount;
uniform float u_radius;

float gauss( vec3 p, float r ) {
  return exp( -dot( p, p ) / r );
}

float dist( vec3 p, float r ) {
  return length( p ) < r ? 1.0 : 0.0;
}

// Adds color to a radius around the provided position
// Either with gaussian splat, or strict distance function
// TODO: When density is set to negative value, it should not go below zero
// Velocity can be negative, maybe use new fragment shader for that?
void main( ) {
  vec3 pos = get3DFragCoord( );

  vec3 base = texture3D( u_readTexture, pos ).xyz;

  vec3 worldPos = ( pos / u_resolution ) * u_size;
  vec3 coord = u_position.xyz - worldPos;

  vec3 colorNormalized = u_color;
  if ( length( u_color ) > 0. ) {
    colorNormalized = normalize( u_color );
  }

  vec3 splat = colorNormalized * u_amount * gauss( coord, u_radius );
  //vec3 splat = ( u_amount * colorNormalized * dist( coord, u_radius )) / u_resolution;

  gl_FragColor = vec4( base + splat , 1.0 );
}
