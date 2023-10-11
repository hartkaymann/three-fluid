
attribute vec3 position;
attribute vec2 uv;
attribute float depth;

uniform vec3 size;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 vUv;
varying vec3 vColor;
varying float vZ;

void main() {
    vUv = uv;
    vZ = depth;

    vColor = position;

    vec3 tiledPos = vec3(
        position.x,
        position.y,
        position.z
    );

    gl_Position = projectionMatrix * modelViewMatrix * vec4(tiledPos, 1.0);
}