precision highp float;

uniform vec3 u_resolution; // grid resolution

uniform sampler2D u_augendTexture;
uniform sampler2D u_addendTexture;

uniform float u_scale;

void main( ) {
    vec2 pos = gl_FragCoord.xy / vec2( u_resolution.x * u_resolution.z, u_resolution.y );

    vec3 term1 = texture2D( u_augendTexture, pos ).xyz;
    vec3 term2 = texture2D( u_addendTexture, pos ).xyz;
    gl_FragColor = vec4( term1 + u_scale * term2, 1.0 );
}