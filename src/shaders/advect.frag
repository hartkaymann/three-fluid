precision highp float;

uniform float dt; // detla time
uniform vec2 res; // grid resolution
uniform float dissipation;

uniform sampler2D advected;
uniform sampler2D velocity;

// Biliear Interpolation
// Source: https://github.com/dushyantbehl/2D-fluid-simulation/blob/master/pShader.cg
vec3 f4texRECTbilerp( sampler2D tex, vec2 p ) {
  vec4 ij; // i0, j0, i1, j1
  ij.xy = floor( p - 0.5 ) + 0.5;
  ij.zw = ij.xy + 1.0;

  vec4 uv = ij / res.xyxy;
  vec3 tex11 = texture2D( tex, uv.xy ).xyz;
  vec3 tex21 = texture2D( tex, uv.zy ).xyz;
  vec3 tex12 = texture2D( tex, uv.xw ).xyz;
  vec3 tex22 = texture2D( tex, uv.zw ).xyz;

  vec2 a = p - ij.xy;

  return mix( mix( tex11, tex21, a.x ), mix( tex12, tex22, a.x ), a.y );
}

void main( ) {
  vec2 uv = gl_FragCoord.xy / res.xy;

  vec2 pos = gl_FragCoord.xy - dt * texture2D( velocity, uv ).xy;
  gl_FragColor = vec4( dissipation * f4texRECTbilerp( advected, pos ), 1.0 );
}