precision highp float;

uniform vec3 res; // grid resolution
uniform sampler2D density;
uniform sampler2D velocity;

uniform float target;
uniform float multiplier;

uniform float halfrdx;
uniform float dt;

// TODO: Move to common.frag
vec3 get3DFragCoord () {
  return vec3(
  mod(gl_FragCoord.x, res.x),
  gl_FragCoord.y,
  floor(gl_FragCoord.x / res.x) + 0.5);
}

// Texture lookup in tiled grid
vec4 texture3D( sampler2D texture, vec3 coordinates ) {
  coordinates = clamp(coordinates, vec3(0.5), vec3(res - 0.5));

  float zFloor = floor(coordinates.z - 0.5);
  float zCeil = zFloor + 1.0;

  float fraction = fract(coordinates.z - 0.5);

  vec2 coordFloor = vec2( 
    ((res.x * zFloor) + coordinates.x) / (res.x * res.z),
    coordinates.y / res.y );
  
  vec2 coordCeil = vec2( 
    ((res.x * zCeil) + coordinates.x) / (res.x * res.z),
    coordinates.y / res.y );
  
  // normalize
  return mix(
    texture2D( texture, coordFloor), 
    texture2D(texture, coordCeil), 
    fraction 
  );
}

float densityToPressure(float density) {
    float densityError = max(0.0, density - target);
    float pressure = densityError * multiplier;
    return pressure; 
}

void main( ) {
  vec3 pos = get3DFragCoord();
  mat3 offset = mat3(1.0);

  float center = texture3D(density, pos).x;
  float right  = texture3D(density, pos + offset[0] ).x;
  float left   = texture3D(density, pos - offset[0] ).x;
  float up     = texture3D(density, pos + offset[1] ).x;
  float down   = texture3D(density, pos - offset[1] ).x;
  float rear   = texture3D(density, pos + offset[2] ).x;
  float front  = texture3D(density, pos - offset[2] ).x;

  vec3 gradient = halfrdx * vec3(right - left,  up - down, rear - front);
  //if(length(gradient) == 0.0)
  //  discard;

  float pressure = densityToPressure(center);
  vec3 pressureAcceleration = pressure * (-gradient);

  gl_FragColor = vec4(pressureAcceleration, 1.0);
}