//#version 300

precision highp float;
precision highp sampler3D;

in vec2 vUv;

uniform float uZCoord;

uniform sampler3D map;

out vec4 color;

void main( ) {
    color = vec4(vUv, uZCoord, 1.0);
    color = vec4(texture(map, vec3(vUv.xy, uZCoord) ).xyz, 1.0);
}