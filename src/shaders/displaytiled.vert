attribute vec3 position;
attribute vec2 uv;
attribute float depth;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;

uniform vec3 cameraPosition;

varying vec2 v_uv;
varying vec3 v_position;
varying vec3 v_cameraPos;
varying float v_z;

void main() {
    v_uv = uv;
    v_z = depth;
    v_cameraPos = cameraPosition;

    v_position = (modelMatrix * vec4(position, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}