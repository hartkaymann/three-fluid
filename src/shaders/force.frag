precision highp float;

uniform vec3 res; // grid resolution
uniform sampler2D read;
uniform float dt;
uniform vec2 position;
uniform vec3 color;
uniform float amount;
uniform float radius;

// TODO: Move to common.frag
// Texture lookup in staggered grid
vec4 texture3D( sampler2D texture, vec3 coordinates ) {
    vec2 texcoord = vec2( res.x * coordinates.z + coordinates.x, coordinates.y );
    texcoord.x /= res.x * res.z;
    texcoord.y /= res.y;

    return texture2D( texture, texcoord.xy );
}

float gauss( vec2 p, float r ) {
    return exp( -dot( p, p ) / r );
}

float dist(vec2 p, float r) {
    return length(p) < r ? 1.0 : 0.0;
}

void main( ) {

    vec2 uv = gl_FragCoord.xy / res.xy;
    vec3 base = texture2D( read, uv.xy ).xyz; // ?????

    vec2 coord = position.xy - uv;
    vec3 splat = dt * color * amount * gauss( coord, radius );
    //vec3 splat = vec3(1.0) * dist(coord, 0.05);
    gl_FragColor = vec4( base + splat, 1.0 );
    //gl_FragColor = vec4(position.xy, 0.0, 1.0);
}
