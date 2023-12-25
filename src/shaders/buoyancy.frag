precision highp float;

uniform sampler2D u_velocityTexture;
uniform sampler2D u_densityTexture;

uniform vec3 u_gravity;

uniform float u_deltaTime;

void main( ) {
  vec3 pos = get3DFragCoord( );
  float mass = texture3D( u_densityTexture, pos ).x;

  vec3 g = u_deltaTime * ( u_gravity / u_resolution );

  g = ( mass == 0.0 ) ? vec3( 0.0 ) : g;

  vec3 base = texture3D( u_velocityTexture, pos ).xyz;

  gl_FragColor = vec4( base + g, 1.0 );
    // gl_FragColor = vec4(base, 1.0);
}