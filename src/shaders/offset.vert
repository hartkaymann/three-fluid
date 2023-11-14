attribute vec3 position;
attribute vec2 uv;
attribute vec3 offset;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec3 vOffset;
varying float vZ;

void main() {
    vOffset = offset;
    vZ = position.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}