precision highp float;
precision highp sampler2D;

uniform vec3 res; // grid resolution
uniform sampler2D read;
uniform float dt;
uniform vec3 position;
uniform vec3 color;
uniform float amount;
uniform float radius;

varying vec2 vUv;

float gauss( vec3 p, float r ) {
    return exp( -dot( p, p ) / r );
}

float dist(vec3 p, float r) {
    return length(p) < r ? 1.0 : 0.0;
}

void main( ) {
    vec2 texcoord = gl_FragCoord.xy / vec2(res.x * res.z, res.y); 
    vec3 pos = vec3( 
    mod( gl_FragCoord.x, res.x ), 
    gl_FragCoord.y, 
    floor( gl_FragCoord.x / res.x ) 
  );

    vec3 base = texture2D( read, texcoord ).xyz;

    vec3 coord = position.xyz - pos / res;
    vec3 splat = dt * color * amount * gauss( coord, radius );
    
    //vec3 splat = vec3(1.0) * dist(coord, 0.01);
    
    gl_FragColor = vec4( base + splat, 1.0 );
    //gl_FragColor = vec4(vec3(length(coord.xyz)), 1.0);
    //gl_FragColor = vUv.xyxy;
}
