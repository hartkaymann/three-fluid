
precision highp float;

// TODO: Move to common.frag
vec3 get3DFragCoord (vec3 resolution) {
  return vec3(
  mod(gl_FragCoord.x, resolution.x),
  gl_FragCoord.y,
  floor(gl_FragCoord.x / resolution.x) + 0.5);
}

// Texture lookup in tiled grid
vec4 texture3D( sampler2D texture, vec3 coordinates, vec3 resolution ) {
  vec3 fullCoords = coordinates * resolution;

  fullCoords = clamp(fullCoords, vec3(0.5), vec3(resolution - 0.5));

  float zFloor = floor(fullCoords.z - 0.5);
  float zCeil = zFloor + 1.0;

  float fraction = fract(fullCoords.z - 0.5);

  vec2 coordFloor = vec2( 
    ((resolution.x * zFloor) + fullCoords.x) / (resolution.x * resolution.z),
    fullCoords.y / resolution.y );
  
  vec2 coordCeil = vec2( 
    ((resolution.x * zCeil) + fullCoords.x) / (resolution.x * resolution.z),
    fullCoords.y / resolution.y );
  
  // normalize
  return mix(
    texture2D( texture, coordFloor), 
    texture2D(texture, coordCeil), 
    fraction 
  );
}