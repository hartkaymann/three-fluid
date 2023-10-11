precision highp float;
precision highp sampler2D;

uniform vec3 size;
uniform vec3 res; // grid resolution
uniform sampler2D read;
uniform float dt;
uniform vec3 position;
uniform vec3 color;
uniform float amount;
uniform float radius;

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

float gauss( vec3 p, float r ) {
    return exp( -dot( p, p ) / r );
}

float dist(vec3 p, float r) {
    return length(p) < r ? 1.0 : 0.0;
}

void main( ) {
    vec3 pos = get3DFragCoord();

    vec3 base = texture3D( read, pos ).xyz;

    vec3 worldPos = (pos / res) * size;
    vec3 coord = position.xyz - worldPos;

    vec3 colorNormalized = color;
    if(length(color) > 0.) { 
      colorNormalized = normalize(color);
    }

    vec3 splat = dt * colorNormalized * amount * gauss( coord, radius );
    
    //vec3 splat = vec3(1.0) * dist(coord, 0.01);
    
    gl_FragColor = vec4( base + splat, 1.0 );
    //gl_FragColor = vec4(vec3(length(coord.xyz)), 1.0);
    //gl_FragColor = vec4(position, 1.0);
}
