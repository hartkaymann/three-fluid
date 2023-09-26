precision highp float;

uniform sampler2D read;

uniform vec3 res; // grid resolution
uniform vec3 offset;
uniform float scale;

// TODO: Move to common.frag
// Texture lookup in staggered grid
vec4 texture3D(sampler2D texture, vec3 coordinates) {
    vec2 texcoord = vec2(res.x * coordinates.z + coordinates.x, coordinates.y);
    texcoord.x /= res.x * res.z;
    texcoord.y /= res.y;

    return texture2D(texture, texcoord.xy);
}

void main() {
    vec3 texcoord = gl_FragCoord.xyz + offset;
    gl_FragColor = vec4(scale * texture3D(read, texcoord).xyz, 1.0);
    //gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
    //gl_FragColor = vec4(uv.xyxy);
}
