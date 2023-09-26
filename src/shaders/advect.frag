precision highp float;

uniform float dt; // detla time
uniform vec3 res; // grid resolution
uniform float dissipation;

uniform sampler2D advected;
uniform sampler2D velocity;

// TODO: Move to common.frag
// Texture lookup in staggered grid
vec4 texture3D( sampler2D texture, vec3 coordinates ) {
  vec2 ij = vec2( res.x * coordinates.z + coordinates.x, coordinates.y );
  // normalize
  ij.x /= res.x * res.z;
  ij.y /= res.y;

  return texture2D( texture, ij.xy );
}

// Biliear interpolation
vec3 f4texRECTbilerp( sampler2D tex, vec2 p ) {
  // Scale up position to get right texel coordinates ( cant use floor otherwise)
  vec2 position = p * res.xy;

  vec4 ij; // i0, j0, i1, j1
  ij.xy = floor( position - 0.5 ) + 0.5;
  ij.zw = ij.xy + 1.0;

  vec4 uv = ij / res.xyxy;
  vec3 tex11 = texture2D( tex, uv.xy ).xyz;
  vec3 tex21 = texture2D( tex, uv.zy ).xyz;
  vec3 tex12 = texture2D( tex, uv.xw ).xyz;
  vec3 tex22 = texture2D( tex, uv.zw ).xyz;

  vec2 a = position - ij.xy;

  return mix( mix( tex11, tex21, a.x ), mix( tex12, tex22, a.x ), a.y );
}

void main( ) {
  vec2 texcoord = gl_FragCoord.xy / res.xy;
  vec3 pos = vec3(
      mod(gl_FragCoord.x, res.x),
      gl_FragCoord.y,
      (gl_FragCoord.x - mod(gl_FragCoord.x, res.x)) / res.x    
  );

  vec3 new_pos = pos.xyz - dt * texture3D( velocity, pos ).xyz;
  //gl_FragColor = vec4( dissipation * f4texRECTbilerp( advected, new_pos ).xyz, 1.0 );
  gl_FragColor = vec4(dissipation * texture3D(advected, new_pos)); 

  //gl_FragColor = vec4(pos / res, 1.0);
}