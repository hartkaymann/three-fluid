precision highp float;
precision highp sampler2D;

uniform sampler2D u_readTexture;

uniform vec3 u_size;
uniform vec3 u_resolution;
uniform vec3 u_position;
uniform vec3 u_color;

uniform float u_deltaTime;
uniform float u_amount;
uniform float u_radius;

varying vec2 vUv;

float gauss( vec3 p, float r ) {
  return exp( -dot( p, p ) / r );
}

float dist( vec3 p, float r ) {
  return length( p ) < r ? 1.0 : 0.0;
}

void main( ) {
  vec3 pos = get3DFragCoord( u_resolution );

  vec3 base = texture3D( u_readTexture, pos / u_resolution, u_resolution ).xyz;

  vec3 worldPos = ( pos / u_resolution ) * u_size;
  vec3 coord = u_position.xyz - worldPos;

  vec3 colorNormalized = u_color;
  if ( length( u_color ) > 0. ) {
    colorNormalized = normalize( u_color );
  }

  vec3 splat = u_deltaTime * colorNormalized * u_amount * gauss( coord, u_radius );
  //vec3 splat = ( u_amount * colorNormalized * dist( coord, u_radius )) / u_resolution;

  gl_FragColor = vec4( base + splat , 1.0 );
    //gl_FragColor = vec4(vec3(length(coord.xyz)), 1.0);
  // gl_FragColor = vec4(position, 1.0);
}
