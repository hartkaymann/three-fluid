precision highp float;

uniform vec2 u_textureResolution;
uniform vec3 u_tileCount;

varying float v_z;

vec3 get3DFragCoord (vec3 resolution) {
  return vec3(
    mod(gl_FragCoord.x, resolution.x),
    mod(gl_FragCoord.y, resolution.y),
    v_z + 0.5
  );
}

// Texture lookup in tiled grid
vec4 texture3D( 
  sampler2D texture, 
  vec3 coordinates, 
  vec3 resolution 
  ) {

  vec3 fullCoords = coordinates * resolution;

  fullCoords = clamp(fullCoords, vec3(0.5), vec3(resolution - 0.5));

  float zFloor = floor(fullCoords.z - 0.5);
  float zCeil = zFloor + 1.0;

  float fraction = fract(fullCoords.z - 0.5);

  vec2 coordFloor = vec2( 
    (mod(zFloor, u_tileCount.x) * resolution.x + fullCoords.x) / u_textureResolution.x,
    (floor(zFloor / u_tileCount.x) * resolution.y + fullCoords.y) / u_textureResolution.y
  );

  vec2 coordCeil = vec2( 
    (mod(zCeil, u_tileCount.x) * resolution.x + fullCoords.x) / u_textureResolution.x,
    (floor(zCeil / u_tileCount.x) * resolution.y + fullCoords.y) / u_textureResolution.y
  );
  
  // Interpolate between floor and ceil values
  return mix(
    texture2D( texture, coordFloor), 
    texture2D(texture, coordCeil), 
    fraction 
  );
}