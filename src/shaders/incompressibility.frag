precision highp float;

uniform sampler2D u_densityTexture;
uniform sampler2D u_velocityTexture;

uniform vec3 u_resolution;

uniform float u_deltaTime;
uniform float u_target;
uniform float u_multiplier;
uniform float u_halfrdx;

float densityToPressure(float density) {
    float densityError = max(0.0, density - u_target);
    float pressure = densityError * u_multiplier;
    return pressure; 
}

void main( ) {
  vec3 pos = get3DFragCoord( u_resolution );
  mat3 offset = mat3(1.0);

  float center = texture3D(u_densityTexture, pos / u_resolution, u_resolution).x;
  float right  = texture3D(u_densityTexture, (pos + offset[0]) / u_resolution, u_resolution ).x;
  float left   = texture3D(u_densityTexture, (pos - offset[0]) / u_resolution, u_resolution ).x;
  float up     = texture3D(u_densityTexture, (pos + offset[1]) / u_resolution, u_resolution ).x;
  float down   = texture3D(u_densityTexture, (pos - offset[1]) / u_resolution, u_resolution ).x;
  float rear   = texture3D(u_densityTexture, (pos + offset[2]) / u_resolution, u_resolution ).x;
  float front  = texture3D(u_densityTexture, (pos - offset[2]) / u_resolution, u_resolution ).x;

  vec3 gradient = u_halfrdx * vec3(right - left,  up - down, rear - front);
  //if(length(gradient) == 0.0)
  //  discard;

  float pressure = densityToPressure(center);
  vec3 pressureAcceleration = pressure * (-gradient);

  gl_FragColor = vec4(pressureAcceleration, 1.0);
}