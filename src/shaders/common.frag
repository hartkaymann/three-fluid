
precision highp float;


// Texture lookup in staggered grid
vec4 texture3D(sampler2D texture, vec3 coordinates, vec3 resolution) {
    vec2 texcoord = vec2(resolution.x * coordinates.z + coordinates.x, coordinates.y); 
    texcoord.x /= resolution.x * resolution.z;
    texcoord.y /= resolution.y;

    return texture2D(texture, texcoord.xy);
}