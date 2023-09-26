precision highp float;

uniform vec3 res; // grid resolution
uniform sampler2D read;
uniform float dt;
uniform vec3 position;
uniform vec3 color;
uniform float amount;
uniform float radius;

// TODO: Move to common.frag
// Texture lookup in staggered grid
vec4 texture3D( sampler2D texture, vec3 coordinates ) {
  //vec2 texcoord = vec2( res.x * coordinates.z + coordinates.x, coordinates.y );
  // normalize
  coordinates.x /= res.x * res.z;
  coordinates.y /= res.y;

  return texture2D( texture, coordinates.xy );
}


float gauss( vec3 p, float r ) {
    return exp( -dot( p, p ) / r );
}

float dist(vec3 p, float r) {
    return length(p) < r ? 1.0 : 0.0;
}

void main( ) {
    vec2 texcoord = gl_FragCoord.xy / vec2(res.x * res.z, res.y); 
    vec3 pos = vec3(
      mod(gl_FragCoord.x, res.x),
      gl_FragCoord.y,
      (gl_FragCoord.x - mod(gl_FragCoord.x, res.x)) / res.x    
    );

    vec3 base = texture2D( read, texcoord ).xyz;

    vec3 coord = position.xyz - vec3(texcoord, 0.0);
    vec3 splat = dt * color * amount * gauss( coord, radius );
    
    //vec3 splat = vec3(1.0) * dist(coord, 0.05);
    
    gl_FragColor = vec4( base + splat, 1.0 );
    // gl_FragColor = vec4(texcoord.xyz, 1.0);
}
