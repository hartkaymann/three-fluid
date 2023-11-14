
attribute vec3 position;
attribute vec2 uv;
attribute float depth;

uniform vec3 u_size;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 vUv;
varying vec3 vColor;
varying float vZ;

void main() {
    vUv = uv;
    vZ = depth;

    vColor = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}