precision highp float;

uniform sampler2D u_pressureTexture;
uniform sampler2D u_velocityTexture;

uniform float u_halfrdx;

void main( ) {
  vec3 pos = get3DFragCoord( );
  mat3 offset = mat3(1.0);

  // Get pressure values from neighbors.
  float right = texture3D(u_pressureTexture, (pos + offset[0]) ).x;
  float left  = texture3D(u_pressureTexture, (pos - offset[0]) ).x;
  float up    = texture3D(u_pressureTexture, (pos + offset[1]) ).x;
  float down  = texture3D(u_pressureTexture, (pos - offset[1]) ).x;
  float back  = texture3D(u_pressureTexture, (pos + offset[2]) ).x;
  float front = texture3D(u_pressureTexture, (pos - offset[2]) ).x;

  // Get velocity value from current cell.
  vec3 center = texture3D(u_velocityTexture, pos).xyz;

  // Compute the gradient of pressure at the current cell by taking central differences of neighboring pressure values.
  vec3 gradient = u_halfrdx * vec3(right - left,  up - down, back - front);

  // Project the velocity onto its divergence-free counterpart by subtracting the gradient of pressure.
  gl_FragColor = vec4(center - gradient, 1.0);
}