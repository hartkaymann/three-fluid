precision highp float;

uniform float u_halfrdx;

uniform sampler2D u_pressureTexture;
uniform sampler2D u_velocityTexture;


void main( ) {
  vec3 pos = get3DFragCoord();
    
  mat3 offset = mat3(1.0);

  float right = texture3D(u_pressureTexture, pos + offset[0] ).x;
  float left  = texture3D(u_pressureTexture, pos - offset[0] ).x;
  float up    = texture3D(u_pressureTexture, pos + offset[1] ).x;
  float down  = texture3D(u_pressureTexture, pos - offset[1] ).x;
  float back  = texture3D(u_pressureTexture, pos + offset[2] ).x;
  float front = texture3D(u_pressureTexture, pos - offset[2] ).x;

  vec3 center = texture3D(u_velocityTexture, pos).xyz;
  vec3 gradient = u_halfrdx * vec3(right - left,  up - down, back - front);

  gl_FragColor = vec4(center - gradient, 1.0);
}