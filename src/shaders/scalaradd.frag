precision highp float;

uniform vec3 res; // grid resolution

uniform sampler2D augend;
uniform sampler2D addend;

uniform float scale;

void main( ) {
    vec2 pos = gl_FragCoord.xy / vec2( res.x * res.z, res.y );

    vec3 term1 = texture2D( augend, pos ).xyz;
    vec3 term2 = texture2D( addend, pos ).xyz;
    gl_FragColor = vec4( term1 + scale * term2, 1.0 );
}