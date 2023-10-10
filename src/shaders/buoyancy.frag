precision highp float;

uniform vec3 res; // grid resolution
uniform sampler2D velocity;
uniform sampler2D density;

uniform vec3 gravity;

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

void main( ) {
  vec3 pos = get3DFragCoord();

    float mass = texture3D(density, pos).x; 
    vec3 g = dt * mass * gravity ;
  
    vec3 base = texture3D( velocity, pos ).xyz;

    gl_FragColor = vec4( base + g, 1.0 );
    // gl_FragColor = vec4(base, 1.0);
}