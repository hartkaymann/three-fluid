precision highp float;

uniform vec3 res; // grid resolution
uniform sampler2D x;
uniform sampler2D b;

uniform float alpha;
uniform float rbeta;


// TODO: Move to common.frag
// Texture lookup in staggered grid
vec4 texture3D( sampler2D texture, vec3 coordinates ) {
  //vec2 texcoord = vec2( res.x * coordinates.z + coordinates.x, coordinates.y );
  // normalize
  coordinates.x /= res.x * res.z;
  coordinates.y /= res.y;

  return texture2D( texture, coordinates.xy );
}


void main( ) {
    vec2 uv = gl_FragCoord.xy / res.xy;
    vec3 pos = vec3(
      mod(gl_FragCoord.x, res.x),
      gl_FragCoord.y,
      (gl_FragCoord.x - mod(gl_FragCoord.x, res.x)) / res.x    
    );

    vec3 offsetX = vec3(1.0, 0.0, 0.0);  
    vec3 offsetY = vec3(0.0, 1.0, 0.0);

    vec3 center = texture3D( b, pos).xyz;
    vec3 right  = texture3D( x,pos + offsetX ).xyz;
    vec3 left   = texture3D( x,pos - offsetX ).xyz;
    vec3 up     = texture3D( x,pos + offsetY ).xyz;
    vec3 down   = texture3D( x,pos - offsetY ).xyz;

    gl_FragColor = vec4( ( left + right + up + down + alpha * center) * rbeta, 1.0 );
}