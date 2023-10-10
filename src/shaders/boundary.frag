precision highp float;

uniform sampler2D read;

uniform vec3 res; // grid resolution
uniform float scale;

varying vec2 vOffset;

void main() {
    vec2 texcoord = (gl_FragCoord.xy + vOffset) / vec2(res.x * res.z, res.y);
    gl_FragColor = vec4(scale * texture2D(read, texcoord).xyz, 1.0);
    // gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
    //gl_FragColor = vec4(vOffset.xy / res.xy, 0.0, 1.0);
}
