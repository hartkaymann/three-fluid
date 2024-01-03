attribute vec3 position;
attribute vec2 uv;
attribute vec2 offset;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 v_offset;
varying float v_z;

void main() {
    v_offset = offset;
    v_z = position.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}