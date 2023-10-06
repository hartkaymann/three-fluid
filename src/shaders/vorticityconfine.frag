precision highp float;

uniform vec3 res; // grid resolution
uniform float dt;

uniform float halfrdx;

uniform sampler2D velocity;
uniform sampler2D vorticity;

uniform float curl;

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

    mat3 offset = mat3(1.0);

    float right = texture3D( vorticity, pos + offset[0] ).x;
    float left  = texture3D( vorticity, pos - offset[0] ).x;
    float up    = texture3D( vorticity, pos + offset[1] ).x;
    float down  = texture3D( vorticity, pos - offset[1] ).x;
    float back  = texture3D( vorticity, pos + offset[2] ).x;
    float front = texture3D( vorticity, pos - offset[2] ).x;
    float mid   = texture3D( vorticity, pos ).x;

    vec3 force = halfrdx * vec3( 
        abs( up ) - abs( down ), 
        abs( right ) - abs( left ), 
        abs( back ) - abs( front) 
    );

    float epsilon = 2.4414e-4;
    float magSqr = max( epsilon, dot( force, force ) );

    force *= inversesqrt( magSqr ) * curl * mid; // use half live fast invsqrt?
    force.y *= -1.0;

    vec3 base = texture3D( velocity, pos ).xyz;
    gl_FragColor = vec4( base + ( dt * force ), 1.0 );
}