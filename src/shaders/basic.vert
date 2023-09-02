attribute vec2 uv;
attribute vec3 position;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 texcoord;

void main() {
    texcoord = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}