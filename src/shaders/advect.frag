precision highp float;

uniform float dt; // detla time
uniform vec3 res; // grid resolution
uniform float dissipation;

uniform sampler2D advected;
uniform sampler2D velocity;

varying vec2 vUv;

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

// Trilinear interpolation
vec3 trilerp( sampler2D tex, vec3 p ) {
  vec3 vi = floor( p - 0.5 ) + 0.5;
  vec3 vj = vi + 1.0 ;

  vec3 a = fract(p - 0.5);

  vec3 tex000 = texture3D( tex, vec3( vi.xyz ) ).xyz; // l b f
  vec3 tex100 = texture3D( tex, vec3( vj.x, vi.yz ) ).xyz;  // r b f
  vec3 tex010 = texture3D( tex, vec3( vi.x, vj.y, vi.z ) ).xyz; // l t f
  vec3 tex110 = texture3D( tex, vec3( vj.xy, vi.z ) ).xyz;  // r t f

  vec3 tex001 = texture3D( tex, vec3( vi.xy, vj.z ) ).xyz;  // l b b
  vec3 tex101 = texture3D( tex, vec3( vj.x, vi.y, vj.z ) ).xyz; // r b b
  vec3 tex011 = texture3D( tex, vec3( vi.x, vj.yz ) ).xyz;  // l t b
  vec3 tex111 = texture3D( tex, vec3( vj.xyz ) ).xyz; // r t b
  
  return mix(
  mix( 
    mix( tex000, tex100, a.x ),
    mix( tex010, tex110, a.x ),
    a.y 
    ),
  mix( 
    mix( tex001, tex101, a.x ), 
    mix( tex011, tex111, a.x ),
    a.y 
    ),
    a.z
  );
}

void main( ) {
  vec3 pos = get3DFragCoord();

  vec3 new_pos = pos.xyz - texture3D( velocity, pos ).xyz;
  gl_FragColor = vec4( dissipation * trilerp( advected, new_pos ).xyz, 1.0 );

  //gl_FragColor = vec4(texture3D(advected, pos).xyz, 1.0); 
  
  // gl_FragColor = vec4(pos / res, 1.0);
  //gl_FragColor = vec4(1.0);
}