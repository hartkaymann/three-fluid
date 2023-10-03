attribute vec3 position;
attribute vec2 uv;
attribute vec2 offset;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 vOffset;

void main() {
    vOffset = offset;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}