precision highp float;

uniform vec2 res; // grid resolution
uniform sampler2D pressure; 
uniform sampler2D divergence;

uniform float alpha;
uniform float rbeta;

void main( ) {
  vec2 uv = gl_FragCoord.xy / res.xy;
  float dxp = 1.0 / res.x; // size of a single x pixel
  float dyp = 1.0 / res.y; // size of a single y pixel

  float center  = texture2D( divergence, uv ).x;
  float right   = texture2D( pressure, vec2( uv.x + dxp, uv.y ) ).x;
  float left    = texture2D( pressure, vec2( uv.x - dxp, uv.y ) ).x;
  float up      = texture2D( pressure, vec2( uv.x, uv.y + dyp ) ).x;
  float down    = texture2D( pressure, vec2( uv.x, uv.y - dyp ) ).x;

  gl_FragColor = vec4( ( left + right + up + down + alpha * center ) * rbeta, 0.0, 0.0, 1.0 );
}