precision highp float;

uniform vec3 res; // grid resolution

uniform float halfrdx;

uniform sampler2D velocity;

// TODO: Move to common.frag
// Texture lookup in tiled grid
vec4 texture3D( sampler2D texture, vec3 coordinates ) {
  float zFloor = floor(coordinates.z);
  float zCeil = zFloor + 1.0;
  float fraction = fract(coordinates.z);

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
  vec3 pos = vec3( 
    mod( gl_FragCoord.x, res.x ), 
    gl_FragCoord.y, 
    floor( gl_FragCoord.x / res.x ) 
  );
  
  mat3 offset = mat3(1.0);
  
  float right = texture3D( velocity, pos + offset[0] ).x;
  float left  = texture3D( velocity, pos - offset[0] ).x;
  float up    = texture3D( velocity, pos + offset[1] ).y;
  float down  = texture3D( velocity, pos - offset[1] ).y;
  float back  = texture3D( velocity, pos + offset[2] ).z;
  float front = texture3D( velocity, pos - offset[2] ).z;
  
  float divergence = halfrdx * ( ( right - left ) + ( up - down ) + ( back - front ) );
  gl_FragColor = vec4( divergence, 0.0, 0.0, 1.0 );
  //gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
}