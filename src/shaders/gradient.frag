precision highp float;

uniform sampler2D u_pressureTexture;
uniform sampler2D u_velocityTexture;

uniform vec3 u_resolution;

uniform float u_halfrdx;

void main( ) {
  vec3 pos = get3DFragCoord( u_resolution );
    
  mat3 offset = mat3(1.0);

  float right = texture3D(u_pressureTexture, (pos + offset[0]) / u_resolution, u_resolution ).x;
  float left  = texture3D(u_pressureTexture, (pos - offset[0]) / u_resolution, u_resolution ).x;
  float up    = texture3D(u_pressureTexture, (pos + offset[1]) / u_resolution, u_resolution ).x;
  float down  = texture3D(u_pressureTexture, (pos - offset[1]) / u_resolution, u_resolution ).x;
  float back  = texture3D(u_pressureTexture, (pos + offset[2]) / u_resolution, u_resolution ).x;
  float front = texture3D(u_pressureTexture, (pos - offset[2]) / u_resolution, u_resolution ).x;

  vec3 center = texture3D(u_velocityTexture, pos / u_resolution, u_resolution).xyz;
  vec3 gradient = u_halfrdx * vec3(right - left,  up - down, back - front);

  gl_FragColor = vec4(center - gradient, 1.0);
}