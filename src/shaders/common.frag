precision mediump float;

uniform vec3 u_resolution;
uniform vec2 u_textureResolution;
uniform vec3 u_tileCount;

varying float v_z;

// Returns position at center of fragment in range [0, 0, 0] - [u_resolution.x, u_resolution.x, u_resolution.z] 
vec3 get3DFragCoord () {
  return vec3(
    mod(gl_FragCoord.x, u_resolution.x),
    mod(gl_FragCoord.y, u_resolution.y),
    v_z + 0.5
  );
}

// Texture lookup in tiled grid
vec4 texture3D( 
  sampler2D texture, 
  vec3 coordinates
  ) {
  vec3 coordsClamped = clamp(coordinates, vec3(0.5), vec3(u_resolution - 0.5));

  float zFloor = floor(coordsClamped.z - 0.5);
  float zCeil = zFloor + 1.0;

  float fraction = fract(coordsClamped.z - 0.5);

  vec2 coordFloor = vec2( 
    (mod(zFloor, u_tileCount.x) * u_resolution.x + coordsClamped.x) / u_textureResolution.x,
    (floor(zFloor / u_tileCount.x) * u_resolution.y + coordsClamped.y) / u_textureResolution.y
  );

  vec2 coordCeil = vec2( 
    (mod(zCeil, u_tileCount.x) * u_resolution.x + coordsClamped.x) / u_textureResolution.x,
    (floor(zCeil / u_tileCount.x) * u_resolution.y + coordsClamped.y) / u_textureResolution.y
  );
  
  // Interpolate between floor and ceil values
  return mix(
    texture2D( texture, coordFloor), 
    texture2D(texture, coordCeil), 
    fraction 
  );
}