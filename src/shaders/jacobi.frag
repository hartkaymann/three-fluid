precision highp float;

uniform vec3 res; // grid resolution
uniform sampler2D x;
uniform sampler2D b;

uniform sampler2D marker;

uniform float alpha;
uniform float rbeta;

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
  
  if(texture3D(marker, pos).x == 0.0)
    discard;

  mat3 offset = mat3(1.0);

  vec3 center = texture3D( b, pos).xyz;
  
  vec3 right  = texture3D( x,pos + offset[0] ).xyz;
  vec3 left   = texture3D( x,pos - offset[0] ).xyz;
  vec3 up     = texture3D( x,pos + offset[1] ).xyz;
  vec3 down   = texture3D( x,pos - offset[1] ).xyz;
  vec3 back   = texture3D( x,pos + offset[2] ).xyz;
  vec3 front  = texture3D( x,pos - offset[2] ).xyz;

  gl_FragColor = vec4( ( left + right + up + down + back + front + alpha * center) * rbeta, 1.0 );
}