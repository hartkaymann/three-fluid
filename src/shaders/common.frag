
precision highp float;

uniform vec3 u_resolution; // grid resolution

// TODO: Move to common.frag
vec3 get3DFragCoord () {
  return vec3(
  mod(gl_FragCoord.x, u_resolution.x),
  gl_FragCoord.y,
  floor(gl_FragCoord.x / u_resolution.x) + 0.5);
}

// Texture lookup in tiled grid
vec4 texture3D( sampler2D texture, vec3 coordinates ) {
  coordinates = clamp(coordinates, vec3(0.5), vec3(u_resolution - 0.5));

  float zFloor = floor(coordinates.z - 0.5);
  float zCeil = zFloor + 1.0;

  float fraction = fract(coordinates.z - 0.5);

  vec2 coordFloor = vec2( 
    ((u_resolution.x * zFloor) + coordinates.x) / (u_resolution.x * u_resolution.z),
    coordinates.y / u_resolution.y );
  
  vec2 coordCeil = vec2( 
    ((u_resolution.x * zCeil) + coordinates.x) / (u_resolution.x * u_resolution.z),
    coordinates.y / u_resolution.y );
  
  // normalize
  return mix(
    texture2D( texture, coordFloor), 
    texture2D(texture, coordCeil), 
    fraction 
  );
}