
attribute vec3 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 texcoord;

void main() {
    texcoord = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}