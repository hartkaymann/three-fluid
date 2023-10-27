precision highp float;

uniform sampler2D u_pressureTexture; // x
uniform sampler2D u_divergenceTexture; // b
uniform sampler2D u_markerTexture;

uniform vec3 u_resolution;

uniform float u_alpha;
uniform float u_rbeta;

void main( ) {
  vec3 pos = get3DFragCoord( u_resolution );
  
  if(texture3D(u_markerTexture, pos / u_resolution, u_resolution).x == 0.0)
    discard; // we got ourselves an air cell

  mat3 offset = mat3(1.0);

  vec3 center = texture3D( u_divergenceTexture, pos / u_resolution, u_resolution).xyz;
  
  vec3 right  = texture3D( u_pressureTexture, (pos + offset[0]) / u_resolution, u_resolution ).xyz;
  vec3 left   = texture3D( u_pressureTexture, (pos - offset[0]) / u_resolution, u_resolution ).xyz;
  vec3 up     = texture3D( u_pressureTexture, (pos + offset[1]) / u_resolution, u_resolution ).xyz;
  vec3 down   = texture3D( u_pressureTexture, (pos - offset[1]) / u_resolution, u_resolution ).xyz;
  vec3 back   = texture3D( u_pressureTexture, (pos + offset[2]) / u_resolution, u_resolution ).xyz;
  vec3 front  = texture3D( u_pressureTexture, (pos - offset[2]) / u_resolution, u_resolution ).xyz;

  gl_FragColor = vec4( ( left + right + up + down + back + front + u_alpha * center) * u_rbeta, 1.0 );
}