precision highp float;

uniform sampler2D u_readTexture;

uniform vec3 u_resolution; // grid resolution
uniform float u_scale;

varying vec2 vOffset;

void main() {
    vec2 texcoord = (gl_FragCoord.xy + vOffset) / vec2(u_resolution.x * u_resolution.z, u_resolution.y);
    gl_FragColor = vec4(u_scale * texture2D(u_readTexture, texcoord).xyz, 1.0);
    gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
