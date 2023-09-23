precision highp float;

uniform float dt; // detla time
uniform vec2 res; // grid resolution
uniform float dissipation;

uniform sampler2D advected;
uniform sampler2D velocity;

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

// Bicubic interpolation ???


void main( ) {
  vec2 uv = gl_FragCoord.xy / res.xy;

  vec2 pos = uv - dt * texture2D( velocity, uv ).xy;

  gl_FragColor = vec4( dissipation * f4texRECTbilerp( advected, pos ).xyz, 1.0 );

  //vec2 vel = dt * texture2D(velocity, uv).xy; 
  //vec3 newVel = texture2D( advected, uv - vel ).xyz;
  // gl_FragColor = vec4( pos.xyxy );
}